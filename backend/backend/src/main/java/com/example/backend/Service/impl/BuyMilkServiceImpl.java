package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.BuyMilkService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class BuyMilkServiceImpl implements BuyMilkService {

    private final OrdersRepository ordersRepository;
    private final MilkInventoryRepository milkInventoryRepository;
    private final FarmRepository farmRepository;

    @Transactional
    @CacheEvict(value = "todayMilkBreakdown", allEntries = true)
    @Override
    public OrderResponseDto buyMilk(MilkBuyDto dto, User user) {

        // 1. Resolve buyer
        User buyer = user;

        // 2. Resolve farm (SELLER) from request
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalStateException("Farm not found"));

        // 3. Validate quantity
        double requestedQty = dto.getQuantity();
        if (requestedQty <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        // 4. Fetch available milk for session + date
        MilkInventory inventory = milkInventoryRepository
                .lockInventory(
                        farm.getId(),
                        dto.getDate(),
                        dto.getSession()
                )
                .orElseThrow(() ->
                        new IllegalStateException("Milk not available for selected session")
                );

        // 5. Check availability
        if (inventory.getMilkLiters() < requestedQty) {
            throw new IllegalStateException("Insufficient milk available");
        }

        // 6. Deduct milk (IMPORTANT: write happens here)
        inventory.setMilkLiters(inventory.getMilkLiters() - requestedQty);
        milkInventoryRepository.save(inventory);

        // 7. Create order
        Orders order = new Orders();
        order.setOrderDate(LocalDate.now());
        order.setQuantity(requestedQty);
        order.setSession(dto.getSession());
        order.setStatus(OrderStatus.COMPLETED);
        order.setBuyer(buyer);
        order.setFarm(farm);

        ordersRepository.save(order);

        // 8. Map to DTO and return
        OrderResponseDto dto1 = new OrderResponseDto();
        dto1.setId(order.getId());
        dto1.setOrderDate(order.getOrderDate());
        dto1.setQuantity(order.getQuantity());
        dto1.setSession(order.getSession());
        dto1.setStatus(order.getStatus());
        dto1.setBuyerId(buyer != null ? buyer.getId() : null);
        dto1.setFarmId(farm != null ? farm.getId() : null);

        return dto1;
    }
}
