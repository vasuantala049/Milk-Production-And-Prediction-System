package com.example.backend.Controller;

import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.DTO.OrderPaymentRequestDto;
import com.example.backend.DTO.RazorpayOrderResponseDto;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.FarmAccessService;
import com.example.backend.Service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private static final Comparator<Orders> ORDER_LIST_COMPARATOR = Comparator
            .comparing(Orders::getOrderDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(order -> order.getStatus() == com.example.backend.Entity.type.OrderStatus.PENDING ? 0 : 1)
            .thenComparing(Orders::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Orders::getId, Comparator.nullsLast(Comparator.reverseOrder()));

    private final OrdersRepository ordersRepository;
    private final FarmAccessService farmAccessService;
    private final OrderService orderService;

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponseDto>> getMyOrders(@AuthenticationPrincipal User user) {
        List<Orders> orders = ordersRepository.findByBuyerOrderByOrderDateDescCreatedAtDescIdDesc(user)
                .stream()
                .sorted(ORDER_LIST_COMPARATOR)
                .toList();
        List<OrderResponseDto> dtos = orders.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<OrderResponseDto>> getFarmOrders(
            @PathVariable Long farmId,
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Orders> orders;
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderDate"));
            Page<Orders> orderPage = ordersRepository.findByFarm_Id(farmId, pageable);
            orders = orderPage.getContent().stream().sorted(ORDER_LIST_COMPARATOR).toList();
        } else {
            orders = ordersRepository.findByFarm_IdOrderByOrderDateDescCreatedAtDescIdDesc(farmId)
                    .stream()
                    .sorted(ORDER_LIST_COMPARATOR)
                    .toList();
        }

        List<OrderResponseDto> dtos = orders.stream().map(this::mapToDto).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/farm/{farmId}/date-range")
    public ResponseEntity<List<OrderResponseDto>> getFarmOrdersByDateRange(
            @PathVariable Long farmId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @AuthenticationPrincipal User user) {
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Orders> orders = ordersRepository.findByFarm_IdAndOrderDateBetween(farmId, startDate, endDate)
            .stream()
            .sorted(ORDER_LIST_COMPARATOR)
            .toList();

        List<OrderResponseDto> dtos = orders.stream().map(this::mapToDto).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/farm/{farmId}/pending")
    public ResponseEntity<List<OrderResponseDto>> getPendingOrders(
            @PathVariable Long farmId,
            @AuthenticationPrincipal User user) {
        List<OrderResponseDto> pendingOrders = orderService.getPendingOrders(farmId, user);
        return ResponseEntity.ok(pendingOrders);
    }

    @PatchMapping("/{orderId}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<OrderResponseDto> approveOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {
        OrderResponseDto approvedOrder = orderService.approveOrder(orderId, user);
        return ResponseEntity.ok(approvedOrder);
    }

    @PatchMapping("/{orderId}/reject")
    public ResponseEntity<OrderResponseDto> rejectOrder(
            @PathVariable Long orderId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        OrderResponseDto rejectedOrder = orderService.rejectOrder(orderId, user);
        return ResponseEntity.ok(rejectedOrder);
    }

    @PostMapping("/{orderId}/pay")
    public ResponseEntity<OrderResponseDto> payOrder(
            @PathVariable Long orderId,
            @RequestBody OrderPaymentRequestDto request,
            @AuthenticationPrincipal User user) {
        OrderResponseDto paidOrder = orderService.payForOrder(orderId, request.getAmount(), user);
        return ResponseEntity.ok(paidOrder);
    }

    @PostMapping("/{orderId}/pay/create")
    public ResponseEntity<RazorpayOrderResponseDto> createRazorpayPaymentOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {
        RazorpayOrderResponseDto paymentOrder = orderService.createRazorpayPaymentOrder(orderId, user);
        return ResponseEntity.ok(paymentOrder);
    }

    @PostMapping("/{orderId}/pay/verify")
    public ResponseEntity<OrderResponseDto> verifyRazorpayPayment(
            @PathVariable Long orderId,
            @RequestBody OrderPaymentRequestDto request,
            @AuthenticationPrincipal User user) {
        OrderResponseDto paidOrder = orderService.verifyRazorpayPayment(orderId, request, user);
        return ResponseEntity.ok(paidOrder);
    }

    private OrderResponseDto mapToDto(Orders order) {
        return OrderResponseDto.builder()
                .id(order.getId())
                .displayCode(resolveDisplayCode(order))
                .orderDate(order.getOrderDate())
                .quantity(order.getQuantity())
                .session(order.getSession())
                .status(order.getStatus())
                .buyerId(order.getBuyer() != null ? order.getBuyer().getId() : null)
                .buyerName(order.getBuyer() != null ? order.getBuyer().getName() : null)
                .farmId(order.getFarm() != null ? order.getFarm().getId() : null)
                .farmName(order.getFarm() != null ? order.getFarm().getName() : null)
                .animalType(order.getAnimalType())
                .totalPrice(order.getTotalPrice())
                .paid(Boolean.TRUE.equals(order.getPaid()))
                .paidAmount(order.getPaidAmount())
                .paidAt(order.getPaidAt())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private String resolveDisplayCode(Orders order) {
        if (order.getDisplayCode() != null && !order.getDisplayCode().isBlank()) {
            return order.getDisplayCode();
        }
        return String.format("%06d", order.getId());
    }
} 

