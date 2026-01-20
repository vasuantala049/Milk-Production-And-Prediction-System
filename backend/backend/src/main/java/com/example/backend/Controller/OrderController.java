package com.example.backend.Controller;

import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Repository.OrdersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrdersRepository ordersRepository;

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
                order.getFarm().getId()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
