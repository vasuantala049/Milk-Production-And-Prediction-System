package com.example.backend.Service.impl;

import com.example.backend.DTO.OrderPaymentRequestDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.DTO.RazorpayOrderResponseDto;
import com.example.backend.Entity.MilkAllocation;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.AllocationType;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.MilkAllocationRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.FarmAccessService;
import com.example.backend.Service.OrderService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

        private final OrdersRepository ordersRepository;
        private final MilkInventoryRepository milkInventoryRepository;
        private final MilkAllocationRepository milkAllocationRepository;
        private final FarmAccessService farmAccessService;
        @Value("${RAZORPAY_KEY}")
        private String razorpayKey;
        @Value("${RAZORPAY_SECRET}")
        private String razorpaySecret;
        private static final Comparator<Orders> ORDER_LIST_COMPARATOR = Comparator
            .comparing(Orders::getOrderDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(order -> order.getStatus() == OrderStatus.PENDING ? 0 : 1)
            .thenComparing(Orders::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Orders::getId, Comparator.nullsLast(Comparator.reverseOrder()));

        @Override
        @Transactional
        public OrderResponseDto approveOrder(Long orderId, User user) {
                // 1. Find order
                Orders order = ordersRepository.findById(orderId)
                                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

                // 2. Verify user has access to the farm
                farmAccessService.verifyFarmAccess(user, order.getFarm().getId());

                // 3. Verify order is in PENDING status
                if (order.getStatus() != OrderStatus.PENDING) {
                        throw new IllegalStateException(
                                        "Only pending orders can be approved. Current status: " + order.getStatus());
                }

                // 4. Update order status to CONFIRMED (no milk availability check required)
                // Owner may have external milk sources not tracked in the system
                order.setStatus(OrderStatus.CONFIRMED);
                order.setConfirmedAt(LocalDateTime.now());
                ordersRepository.save(order);

                // 9. Return response
                return mapToDto(order);
        }



    @Override
    @Transactional
    public OrderResponseDto rejectOrder(Long orderId, User user) {
        // 1. Find order
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // 2. Verify user has access to the farm
        farmAccessService.verifyFarmAccess(user, order.getFarm().getId());

        // 3. Verify order is in PENDING status
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Only pending orders can be rejected. Current status: " + order.getStatus());
        }

        // 4. Update status to CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        ordersRepository.save(order);

        return mapToDto(order);
    }

    @Override
    public List<OrderResponseDto> getPendingOrders(Long farmId, User user) {
        // 1. Verify user has access to the farm
        farmAccessService.verifyFarmAccess(user, farmId);

        // 2. Fetch pending orders for this farm
        List<Orders> pendingOrders = ordersRepository.findByFarm_IdAndStatusOrderByOrderDateDescCreatedAtDescIdDesc(
                farmId,
                OrderStatus.PENDING);

        // 3. Map to DTOs
        return pendingOrders.stream()
                .sorted(ORDER_LIST_COMPARATOR)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void autoRejectTimedOutPendingOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        List<Orders> stalePendingOrders = ordersRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff);
        List<Orders> staleUnpaidConfirmedOrders = ordersRepository.findTimedOutUnpaidConfirmedOrders(cutoff);

        if (stalePendingOrders.isEmpty() && staleUnpaidConfirmedOrders.isEmpty()) {
            return;
        }

        for (Orders order : stalePendingOrders) {
            order.setStatus(OrderStatus.TIMEOUT_REJECTED);
        }

        for (Orders order : staleUnpaidConfirmedOrders) {
            order.setStatus(OrderStatus.TIMEOUT_REJECTED);
        }

        ordersRepository.saveAll(stalePendingOrders);
        ordersRepository.saveAll(staleUnpaidConfirmedOrders);
        log.info(
                "Auto timeout-rejected {} pending orders and {} unpaid confirmed orders older than 1 day",
                stalePendingOrders.size(),
                staleUnpaidConfirmedOrders.size());
    }

    @Override
    @Transactional
    public OrderResponseDto payForOrder(Long orderId, Double amount, User user) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getBuyer() == null || !order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the buyer can pay for this order");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be paid");
        }

        if (Boolean.TRUE.equals(order.getPaid())) {
            throw new IllegalStateException("Order is already paid");
        }

        if (amount == null) {
            throw new IllegalArgumentException("Payment amount is required");
        }

        double expected = order.getTotalPrice() == null ? 0.0 : order.getTotalPrice();
        if (Math.abs(amount - expected) > 0.0001) {
            throw new IllegalArgumentException("Payment amount must be exactly " + expected);
        }

        order.setPaid(true);
        order.setPaidAmount(amount);
        order.setPaidAt(LocalDateTime.now());
        ordersRepository.save(order);

        return mapToDto(order);
    }

    @Override
    @Transactional
    public RazorpayOrderResponseDto createRazorpayPaymentOrder(Long orderId, User user) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getBuyer() == null || !order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the buyer can pay for this order");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be paid");
        }

        if (Boolean.TRUE.equals(order.getPaid())) {
            throw new IllegalStateException("Order is already paid");
        }

        double total = order.getTotalPrice() == null ? 0.0 : order.getTotalPrice();
        long amountInPaise = Math.round(total * 100);
        if (amountInPaise <= 0) {
            throw new IllegalStateException("Order amount must be greater than zero");
        }

        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKey, razorpaySecret);
            String receipt = "ord_" + order.getId() + "_" + System.currentTimeMillis();

            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise);
            options.put("currency", "INR");
            options.put("receipt", receipt);

            JSONObject notes = new JSONObject();
            notes.put("systemOrderId", order.getId());
            notes.put("displayCode", resolveDisplayCode(order));
            options.put("notes", notes);

            Order razorpayOrder = razorpayClient.orders.create(options);
            String razorpayOrderId = razorpayOrder.get("id");

            order.setRazorpayOrderId(razorpayOrderId);
            ordersRepository.save(order);

            return RazorpayOrderResponseDto.builder()
                    .keyId(razorpayKey)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .receipt(receipt)
                    .build();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to initialize Razorpay payment: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public OrderResponseDto verifyRazorpayPayment(Long orderId, OrderPaymentRequestDto request, User user) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getBuyer() == null || !order.getBuyer().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the buyer can pay for this order");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be paid");
        }

        if (Boolean.TRUE.equals(order.getPaid())) {
            throw new IllegalStateException("Order is already paid");
        }

        if (request == null
                || request.getRazorpayOrderId() == null
                || request.getRazorpayPaymentId() == null
                || request.getRazorpaySignature() == null) {
            throw new IllegalArgumentException("Razorpay verification payload is required");
        }

        if (order.getRazorpayOrderId() != null && !order.getRazorpayOrderId().equals(request.getRazorpayOrderId())) {
            throw new IllegalStateException("Payment order mismatch");
        }

        try {
            JSONObject verifyPayload = new JSONObject();
            verifyPayload.put("razorpay_order_id", request.getRazorpayOrderId());
            verifyPayload.put("razorpay_payment_id", request.getRazorpayPaymentId());
            verifyPayload.put("razorpay_signature", request.getRazorpaySignature());
            boolean signatureValid = Utils.verifyPaymentSignature(verifyPayload, razorpaySecret);

            if (!signatureValid) {
                throw new IllegalStateException("Payment signature verification failed");
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to verify Razorpay payment: " + ex.getMessage());
        }

        double expected = order.getTotalPrice() == null ? 0.0 : order.getTotalPrice();
        if (request.getAmount() != null && Math.abs(request.getAmount() - expected) > 0.0001) {
            throw new IllegalArgumentException("Payment amount must be exactly " + expected);
        }

        order.setPaid(true);
        order.setPaidAmount(expected);
        order.setPaidAt(LocalDateTime.now());
        order.setRazorpayOrderId(request.getRazorpayOrderId());
        order.setRazorpayPaymentId(request.getRazorpayPaymentId());
        ordersRepository.save(order);

        return mapToDto(order);
    }

    private OrderResponseDto mapToDto(Orders order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setDisplayCode(resolveDisplayCode(order));
        dto.setOrderDate(order.getOrderDate());
        dto.setQuantity(order.getQuantity());
        dto.setSession(order.getSession());
        dto.setTimeSlot(order.getTimeSlot());
        dto.setStatus(order.getStatus());
        dto.setBuyerId(order.getBuyer() != null ? order.getBuyer().getId() : null);
        dto.setBuyerName(order.getBuyer() != null ? order.getBuyer().getName() : order.getBuyerName());
        dto.setFarmId(order.getFarm() != null ? order.getFarm().getId() : null);
        dto.setFarmName(order.getFarm() != null ? order.getFarm().getName() : order.getFarmName());
        dto.setAnimalType(order.getAnimalType());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setPaid(Boolean.TRUE.equals(order.getPaid()));
        dto.setPaidAmount(order.getPaidAmount());
        dto.setPaidAt(order.getPaidAt());
        dto.setCreatedAt(order.getCreatedAt());
        return dto;
    }

    private String resolveDisplayCode(Orders order) {
        if (order.getDisplayCode() != null && !order.getDisplayCode().isBlank()) {
            return order.getDisplayCode();
        }
        return String.format("%06d", order.getId());
    }
}
