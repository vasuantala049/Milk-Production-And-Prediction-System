package com.example.backend.Service.impl;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.Orders;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.OrderStatus;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.MilkAllocationRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Repository.OrdersRepository;
import com.example.backend.Service.BuyMilkService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class BuyMilkServiceImpl implements BuyMilkService {

    private static final SecureRandom DISPLAY_CODE_RANDOM = new SecureRandom();

    private final OrdersRepository ordersRepository;
    private final MilkInventoryRepository milkInventoryRepository;
    private final MilkAllocationRepository milkAllocationRepository;
    private final FarmRepository farmRepository;

    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @CacheEvict(value = "todayMilkBreakdown", key = "#dto.farmId"),
            @CacheEvict(value = "farmsList", allEntries = true)
    })
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
        // Only allow 0.5L increments: 0.5, 1.0, 1.5, 2.0, ... — user rule: 0.5 or >=1 whole litres
        boolean isHalf = Math.abs(requestedQty - 0.5) < 0.0001;
        boolean isWholeAboveOne = requestedQty >= 1.0 && Math.abs(requestedQty - Math.round(requestedQty)) < 0.0001;
        if (!isHalf && !isWholeAboveOne) {
            throw new IllegalArgumentException("Quantity must be 0.5L or a whole number of liters (1L, 2L, 3L...)");
        }

        // 4. Create order with PENDING status (awaiting owner approval)
        // NOTE: Stock availability check has been removed. Request will be sent to owner regardless of available stock.
        Orders order = new Orders();
        order.setOrderDate(LocalDate.now());
        order.setQuantity(requestedQty);
        order.setSession(dto.getSession());
        order.setStatus(OrderStatus.PENDING); // Changed from COMPLETED to PENDING
        order.setBuyer(buyer);
        order.setFarm(farm);
        order.setAnimalType(dto.getAnimalType());
        order.setDisplayCode(nextDisplayCode(farm.getId()));
        order.setPaid(false);

        // Compute total price based on animal type and farm prices
        double pricePerLiter;
        String animalType = dto.getAnimalType();
        if ("COW".equalsIgnoreCase(animalType) && farm.getCowPrice() != null) {
            pricePerLiter = farm.getCowPrice();
        } else if ("BUFFALO".equalsIgnoreCase(animalType) && farm.getBuffaloPrice() != null) {
            pricePerLiter = farm.getBuffaloPrice();
        } else if ("SHEEP".equalsIgnoreCase(animalType) && farm.getSheepPrice() != null) {
            pricePerLiter = farm.getSheepPrice();
        } else if ("GOAT".equalsIgnoreCase(animalType) && farm.getGoatPrice() != null) {
            pricePerLiter = farm.getGoatPrice();
        } else {
            pricePerLiter = farm.getPricePerLiter() != null ? farm.getPricePerLiter() : 0.0;
        }
        order.setTotalPrice(requestedQty * pricePerLiter);
        order.setBuyerName(buyer.getName());
        order.setFarmName(farm.getName());

        ordersRepository.save(order);

        // NOTE: Allocation will be created when owner approves the order
        // This prevents allocating milk for orders that may be rejected

        // 9. Map to DTO and return
        OrderResponseDto dto1 = new OrderResponseDto();
        dto1.setId(order.getId());
        dto1.setDisplayCode(resolveDisplayCode(order));
        dto1.setOrderDate(order.getOrderDate());
        dto1.setQuantity(order.getQuantity());
        dto1.setSession(order.getSession());
        dto1.setStatus(order.getStatus());
        dto1.setBuyerId(buyer != null ? buyer.getId() : null);
        dto1.setFarmId(farm != null ? farm.getId() : null);
        dto1.setAnimalType(order.getAnimalType());
        dto1.setTotalPrice(order.getTotalPrice());
        dto1.setPaid(Boolean.FALSE);
        dto1.setCreatedAt(order.getCreatedAt());

        return dto1;
    }

    private String nextDisplayCode(Long farmId) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = String.valueOf(100000 + DISPLAY_CODE_RANDOM.nextInt(900000));
            if (!ordersRepository.existsByFarm_IdAndDisplayCode(farmId, candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique order display code for this farm");
    }

    private String resolveDisplayCode(Orders order) {
        if (order.getDisplayCode() != null && !order.getDisplayCode().isBlank()) {
            return order.getDisplayCode();
        }
        return String.format("%06d", order.getId());
    }

}
