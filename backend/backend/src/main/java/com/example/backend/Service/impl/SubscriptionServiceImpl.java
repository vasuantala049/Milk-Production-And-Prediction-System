package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.SubscribeDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.SubscriptionStatus;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.SubscriptionRepository;
import com.example.backend.Service.BuyMilkService;
import com.example.backend.Service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final FarmRepository farmRepository;
    private final BuyMilkService buyMilkService;

    @Override
    @Transactional
    public Subscription subscribe(SubscribeDto dto, User user) {
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        // Validate time-based slot restrictions for same-day subscriptions
        LocalDate startDate = dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now();
        if (startDate.equals(LocalDate.now())) {
            validateTimeSlot(dto.getSession());
        }

        Subscription subscription = Subscription.builder()
                .buyer(user)
                .farm(farm)
                .quantity(dto.getQuantity())
                .session(dto.getSession())
                .startDate(startDate)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        return subscriptionRepository.save(subscription);
    }

    @Override
    public Subscription cancelSubscription(Long id, User user) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (!subscription.getBuyer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to cancel this subscription");
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        return subscriptionRepository.save(subscription);
    }

    @Override
    public List<Subscription> getMySubscriptions(User user) {
        return subscriptionRepository.findByBuyer(user);
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
                // Check if subscription has started and not ended
                if (sub.getStartDate().isAfter(today)) {
                    continue;
                }
                if (sub.getEndDate() != null && sub.getEndDate().isBefore(today)) {
                    sub.setStatus(SubscriptionStatus.COMPLETED); // Or EXPIRED
                    subscriptionRepository.save(sub);
                    continue;
                }

                // Construct BuyDto
                MilkBuyDto buyDto = new MilkBuyDto();
                buyDto.setFarmId(sub.getFarm().getId());
                buyDto.setQuantity(sub.getQuantity());
                buyDto.setSession(sub.getSession());
                buyDto.setDate(today);

                // Use BuyMilkService to place order (handles inventory)
                buyMilkService.buyMilk(buyDto, sub.getBuyer());
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
}
