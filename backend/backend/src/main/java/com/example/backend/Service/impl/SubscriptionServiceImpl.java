package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.DTO.SubscribeDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Entity.type.SubscriptionStatus;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Repository.SubscriptionRepository;
import com.example.backend.Service.BuyMilkService;
import com.example.backend.Service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private static final int MAX_BILLING_DAYS = 30;
    private static final SecureRandom DISPLAY_CODE_RANDOM = new SecureRandom();
        private static final Comparator<Subscription> SUBSCRIPTION_LIST_COMPARATOR = Comparator
            .comparing(Subscription::getStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(subscription -> subscription.getStatus() == SubscriptionStatus.PENDING ? 0 : 1)
            .thenComparing(Subscription::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Subscription::getId, Comparator.nullsLast(Comparator.reverseOrder()));

    private final SubscriptionRepository subscriptionRepository;
    private final FarmRepository farmRepository;
    private final BuyMilkService buyMilkService;
    private final OrdersRepository ordersRepository;
    private final com.example.backend.Service.FarmAccessService farmAccessService;

    @Override
    @Transactional
    public Subscription subscribe(SubscribeDto dto, User user) {
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        String buyerAddress = resolveBuyerAddress(user);
        if (buyerAddress == null || buyerAddress.isBlank() || user.getCity() == null || user.getCity().isBlank()) {
            throw new IllegalStateException("Please set both address and city before creating a subscription");
        }

        // Validate time-based slot restrictions for same-day subscriptions
        LocalDate startDate = dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now();
        if (startDate.equals(LocalDate.now())) {
            validateTimeSlot(dto.getSession());
        }

        Subscription subscription = Subscription.builder()
                .buyer(user)
                .farm(farm)
                .displayCode(nextDisplayCode(farm.getId()))
                .quantity(dto.getQuantity())
                .session(dto.getSession())
                .startDate(startDate)
                .animalType(dto.getAnimalType())
                .billingDayCounter(0)
                .status(SubscriptionStatus.PENDING)
                .build();

        return subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public Subscription approveSubscription(Long subscriptionId, Long farmId, User owner) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        // Verify subscription belongs to the specified farm
        if (!subscription.getFarm().getId().equals(farmId)) {
            throw new IllegalArgumentException("Subscription does not belong to this farm");
        }

        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(owner, farmId);

        if (subscription.getStatus() != SubscriptionStatus.PENDING) {
            throw new IllegalStateException("Only pending subscriptions can be approved.");
        }

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        return subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public Subscription rejectSubscription(Long subscriptionId, Long farmId, User owner) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        // Verify subscription belongs to the specified farm
        if (!subscription.getFarm().getId().equals(farmId)) {
            throw new IllegalArgumentException("Subscription does not belong to this farm");
        }

        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(owner, farmId);

        if (subscription.getStatus() != SubscriptionStatus.PENDING) {
            throw new IllegalStateException("Only pending subscriptions can be rejected.");
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        return subscriptionRepository.save(subscription);
    }

    @Override
    public Subscription cancelSubscription(Long id, Double amount, User user) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (!subscription.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to cancel this subscription");
        }

        int outstandingCounter = normalizeCounter(subscription.getBillingDayCounter());
        if (outstandingCounter > 0) {
            if (amount == null) {
                throw new IllegalArgumentException("Outstanding subscription payment is required before cancellation");
            }

            double expected = calculateBillingAmountDue(subscription, outstandingCounter);
            if (Math.abs(amount - expected) > 0.0001) {
                throw new IllegalArgumentException("Cancellation payment amount must be exactly " + expected);
            }

            subscription.setBillingDayCounter(0);
            subscription.setBillingCounterUpdatedDate(null);
            subscription.setLastCyclePaidAt(LocalDateTime.now());
        }

        subscription.setEndDate(LocalDate.now());
        subscription.setSkipDate(null);
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        return subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public Subscription skipToday(Long id, User user) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (!subscription.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to update this subscription");
        }

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only active subscriptions can skip today's delivery");
        }

        LocalDate today = LocalDate.now();
        if (subscription.getStartDate() != null && subscription.getStartDate().isAfter(today)) {
            throw new IllegalStateException("This subscription has not started yet");
        }
        if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(today)) {
            throw new IllegalStateException("This subscription has already ended");
        }

        subscription.setSkipDate(today);

        int counter = normalizeCounter(subscription.getBillingDayCounter());
        if (today.equals(subscription.getBillingCounterUpdatedDate()) && counter > 0) {
            subscription.setBillingDayCounter(counter - 1);
            subscription.setBillingCounterUpdatedDate(null);
        }

        List<Orders> todaysPendingOrders = ordersRepository.findBySubscription_IdAndOrderDateAndStatus(
                subscription.getId(),
                today,
                OrderStatus.PENDING);
        for (Orders order : todaysPendingOrders) {
            order.setStatus(OrderStatus.CANCELLED);
        }
        if (!todaysPendingOrders.isEmpty()) {
            ordersRepository.saveAll(todaysPendingOrders);
        }

        return subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public Subscription paySubscriptionCycle(Long id, Double amount, User user) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (!subscription.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to pay for this subscription");
        }

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only active subscriptions can be paid");
        }

        int counter = normalizeCounter(subscription.getBillingDayCounter());

        if (amount == null) {
            throw new IllegalArgumentException("Payment amount is required");
        }

        double expected = calculateBillingAmountDue(subscription, counter);
        if (Math.abs(amount - expected) > 0.0001) {
            throw new IllegalArgumentException("Payment amount must be exactly " + expected);
        }

        subscription.setBillingDayCounter(0);
        subscription.setBillingCounterUpdatedDate(null);
        subscription.setLastCyclePaidAt(LocalDateTime.now());

        return subscriptionRepository.save(subscription);
    }

    @Override
    public List<Subscription> getMySubscriptions(User user) {
        return subscriptionRepository.findByBuyer(user).stream()
                .sorted(SUBSCRIPTION_LIST_COMPARATOR)
                .toList();
    }

    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void autoRejectTimedOutPendingSubscriptions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        List<Subscription> stalePendingSubs = subscriptionRepository.findByStatusAndCreatedAtBefore(
                SubscriptionStatus.PENDING,
                cutoff);

        if (stalePendingSubs.isEmpty()) {
            return;
        }

        for (Subscription subscription : stalePendingSubs) {
            subscription.setStatus(SubscriptionStatus.TIMEOUT_REJECTED);
        }

        subscriptionRepository.saveAll(stalePendingSubs);
        log.info("Auto timeout-rejected {} pending subscriptions older than 1 day", stalePendingSubs.size());
    }

    private String nextDisplayCode(Long farmId) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = String.valueOf(100000 + DISPLAY_CODE_RANDOM.nextInt(900000));
            if (!subscriptionRepository.existsByFarm_IdAndDisplayCode(farmId, candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique subscription display code for this farm");
    }

    @Override
    @Scheduled(cron = "0 0 6 * * *") // Runs daily at 6 AM
    // @Scheduled(fixedRate = 60000) // For testing: runs every minute
    public void generateDailyOrders() {
        log.info("Generating daily orders from subscriptions...");
        List<Subscription> activeSubs = subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE);
        LocalDate today = LocalDate.now();

        for (Subscription sub : activeSubs) {
            try {
                if (sub.getSkipDate() != null && sub.getSkipDate().isBefore(today)) {
                    sub.setSkipDate(null);
                    subscriptionRepository.save(sub);
                }

                // Check if subscription has started and not ended
                if (sub.getStartDate().isAfter(today)) {
                    continue;
                }
                if (sub.getEndDate() != null && sub.getEndDate().isBefore(today)) {
                    sub.setStatus(SubscriptionStatus.COMPLETED); // Or EXPIRED
                    subscriptionRepository.save(sub);
                    continue;
                }
                if (today.equals(sub.getSkipDate())) {
                    log.info("Skipping today's order for subscription: {}", sub.getId());
                    sub.setSkipDate(null);
                    subscriptionRepository.save(sub);
                    continue;
                }

                int currentCounter = normalizeCounter(sub.getBillingDayCounter());
                if (currentCounter >= MAX_BILLING_DAYS) {
                    log.info("Payment pending for subscription {}, skipping daily order generation", sub.getId());
                    if (sub.getBillingDayCounter() == null || sub.getBillingDayCounter() > MAX_BILLING_DAYS) {
                        sub.setBillingDayCounter(MAX_BILLING_DAYS);
                        subscriptionRepository.save(sub);
                    }
                    continue;
                }

                // Construct BuyDto
                MilkBuyDto buyDto = new MilkBuyDto();
                buyDto.setFarmId(sub.getFarm().getId());
                buyDto.setQuantity(sub.getQuantity());
                buyDto.setSession(sub.getSession());
                buyDto.setDate(today);
                buyDto.setAnimalType(sub.getAnimalType());

                // Use BuyMilkService to place order (handles inventory)
                OrderResponseDto generatedOrder = buyMilkService.buyMilk(buyDto, sub.getBuyer());
                ordersRepository.findById(generatedOrder.getId()).ifPresent(order -> {
                    order.setSubscription(sub);
                    ordersRepository.save(order);
                });

                if (!today.equals(sub.getBillingCounterUpdatedDate())) {
                    sub.setBillingDayCounter(Math.min(MAX_BILLING_DAYS, currentCounter + 1));
                    sub.setBillingCounterUpdatedDate(today);
                    subscriptionRepository.save(sub);
                }
                log.info("Order generated for subscription: {}", sub.getId());

            } catch (Exception e) {
                log.error("Failed to generate order for subscription {}: {}", sub.getId(), e.getMessage());
                // verify other subscriptions continue
            }
        }
    }

    /**
     * Validates time-based slot restrictions for same-day subscriptions
     */
    private void validateTimeSlot(com.example.backend.Entity.type.MilkSession session) {
        java.time.LocalTime now = java.time.LocalTime.now();

        if (session == com.example.backend.Entity.type.MilkSession.MORNING) {
            // Morning slot (6 AM - 10 AM) cannot be selected after 10 AM
            if (now.isAfter(java.time.LocalTime.of(10, 0))) {
                throw new IllegalStateException("Morning slot (6 AM - 10 AM) cannot be selected after 10:00 AM");
            }
        } else if (session == com.example.backend.Entity.type.MilkSession.EVENING) {
            // Evening slot (4 PM - 8 PM) cannot be selected after 8 PM
            if (now.isAfter(java.time.LocalTime.of(20, 0))) {
                throw new IllegalStateException("Evening slot (4 PM - 8 PM) cannot be selected after 8:00 PM");
            }
        }
    }

    private int normalizeCounter(Integer counter) {
        if (counter == null || counter < 0) {
            return 0;
        }
        return Math.min(counter, MAX_BILLING_DAYS);
    }

    private double calculateBillingAmountDue(Subscription subscription, int counter) {
        double quantity = subscription.getQuantity() == null ? 0.0 : subscription.getQuantity();
        return counter * quantity * resolvePricePerLiter(subscription);
    }

    private double resolvePricePerLiter(Subscription subscription) {
        if (subscription.getFarm() == null) {
            return 0.0;
        }

        String animalType = subscription.getAnimalType();
        if (animalType == null) {
            return subscription.getFarm().getPricePerLiter() == null ? 0.0 : subscription.getFarm().getPricePerLiter();
        }

        if ("COW".equalsIgnoreCase(animalType) && subscription.getFarm().getCowPrice() != null) {
            return subscription.getFarm().getCowPrice();
        }
        if ("BUFFALO".equalsIgnoreCase(animalType) && subscription.getFarm().getBuffaloPrice() != null) {
            return subscription.getFarm().getBuffaloPrice();
        }
        if ("SHEEP".equalsIgnoreCase(animalType) && subscription.getFarm().getSheepPrice() != null) {
            return subscription.getFarm().getSheepPrice();
        }
        if ("GOAT".equalsIgnoreCase(animalType) && subscription.getFarm().getGoatPrice() != null) {
            return subscription.getFarm().getGoatPrice();
        }
        return subscription.getFarm().getPricePerLiter() == null ? 0.0 : subscription.getFarm().getPricePerLiter();
    }

    private String resolveBuyerAddress(User user) {
        if (user.getAddress() != null && !user.getAddress().isBlank()) {
            return user.getAddress();
        }
        return user.getLocation();
    }
}
