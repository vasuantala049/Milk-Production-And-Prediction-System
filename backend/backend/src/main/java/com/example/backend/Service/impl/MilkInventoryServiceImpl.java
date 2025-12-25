package com.example.backend.Service.impl;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.User;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Service.MilkInventoryService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class MilkInventoryServiceImpl implements MilkInventoryService {

    private final CattleRepository cattleRepository;
    private final MilkInventoryRepository milkInventoryRepository;

    @Override
    public void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser) {

        // 1. Find cattle using unique tagId
        Cattle cattle = cattleRepository.findByTagId(dto.getTagId())
                .orElseThrow(() -> new RuntimeException("Invalid tagId"));

        Farm farm = cattle.getFarm();
        LocalDate today = LocalDate.now();

        // 2. Prevent duplicate morning/evening entry per farm
        boolean exists =
                milkInventoryRepository.existsByFarmIdAndRecordDateAndSession(
                        farm.getId(),
                        today,
                        dto.getSession()
                );

        if (exists) {
            throw new RuntimeException("Milk already entered for this session");
        }

        // 3. Save inventory
        MilkInventory inventory = new MilkInventory();
        inventory.setFarm(farm);
        inventory.setEnteredBy(loggedInUser);
        inventory.setRecordDate(today);
        inventory.setSession(dto.getSession());
        inventory.setMilkLiters(dto.getMilkLiters());

        milkInventoryRepository.save(inventory);
    }
}
