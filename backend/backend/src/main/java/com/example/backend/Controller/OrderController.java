package com.example.backend.Controller;

import com.example.backend.DTO.OrderResponseDto;
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

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrdersRepository ordersRepository;
    private final FarmAccessService farmAccessService;
    private final OrderService orderService;

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponseDto>> getMyOrders(@AuthenticationPrincipal User user) {
        List<Orders> orders = ordersRepository.findByBuyer(user);
        List<OrderResponseDto> dtos = orders.stream().map(order -> new OrderResponseDto(
                order.getId(),
                order.getOrderDate(),
                order.getQuantity(),
                order.getSession(),
                order.getStatus(),
                order.getBuyer().getId(),
                order.getFarm().getId())).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all orders for a specific farm (owner/worker only)
     */
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<OrderResponseDto>> getFarmOrders(
            @PathVariable Long farmId,
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Orders> orders;
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderDate"));
            Page<Orders> orderPage = ordersRepository.findByFarm_Id(farmId, pageable);
            orders = orderPage.getContent();
        } else {
            orders = ordersRepository.findByFarm_IdOrderByOrderDateDesc(farmId);
        }

        List<OrderResponseDto> dtos = orders.stream().map(order -> new OrderResponseDto(
                order.getId(),
                order.getOrderDate(),
                order.getQuantity(),
                order.getSession(),
                order.getStatus(),
                order.getBuyer().getId(),
                order.getFarm().getId())).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get orders for a farm within a date range
     */
    @GetMapping("/farm/{farmId}/date-range")
    public ResponseEntity<List<OrderResponseDto>> getFarmOrdersByDateRange(
            @PathVariable Long farmId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @AuthenticationPrincipal User user) {
        // Verify user has access to this farm
        farmAccessService.verifyFarmAccess(user, farmId);

        List<Orders> orders = ordersRepository.findByFarm_IdAndOrderDateBetween(farmId, startDate, endDate);

        List<OrderResponseDto> dtos = orders.stream().map(order -> new OrderResponseDto(
                order.getId(),
                order.getOrderDate(),
                order.getQuantity(),
                order.getSession(),
                order.getStatus(),
                order.getBuyer().getId(),
                order.getFarm().getId())).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get pending orders for a farm (owner/worker only)
     */
    @GetMapping("/farm/{farmId}/pending")
    public ResponseEntity<List<OrderResponseDto>> getPendingOrders(
            @PathVariable Long farmId,
            @AuthenticationPrincipal User user) {
        List<OrderResponseDto> pendingOrders = orderService.getPendingOrders(farmId, user);
        return ResponseEntity.ok(pendingOrders);
    }

    /**
     * Approve a pending order
     */
    @PatchMapping("/{orderId}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<OrderResponseDto> approveOrder(
            @PathVariable Long orderId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        OrderResponseDto approvedOrder = orderService.approveOrder(orderId, user);
        return ResponseEntity.ok(approvedOrder);
    }

    /**
     * Reject a pending order
     */
    @PatchMapping("/{orderId}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> rejectOrder(
            @PathVariable Long orderId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        orderService.rejectOrder(orderId, user);
        return ResponseEntity.noContent().build();
    }
}
