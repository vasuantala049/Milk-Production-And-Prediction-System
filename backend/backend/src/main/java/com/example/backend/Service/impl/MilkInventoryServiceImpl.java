package com.example.backend.Service.impl;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.Entity.*;
import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Repository.CattleMilkEntryRepository;

import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Service.MilkInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class MilkInventoryServiceImpl implements MilkInventoryService {

    private final CattleRepository cattleRepository;
    private final MilkInventoryRepository milkInventoryRepository;
    private final CattleMilkEntryRepository cattleMilkEntryRepository;

    @Override
    public void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser) {

        // 1. Resolve farm from logged-in user (DO NOT trust request)
        Farm farm = loggedInUser.getAssignedFarm();
        if (farm == null) {
            throw new RuntimeException("User not assigned to any farm");
        }

        // 2. Find cattle using farm + tagId (correct way)
        Cattle cattle = cattleRepository
                .findByFarmIdAndTagId(farm.getId(), dto.getTagId())
                .orElseThrow(() -> new RuntimeException("Invalid tagId for this farm"));

        LocalDate today = LocalDate.now();

        // 3. Prevent duplicate entry PER CATTLE PER SESSION
        boolean exists = cattleMilkEntryRepository
                .existsByCattleIdAndRecordDateAndSession(
                        cattle.getId(),
                        today,
                        dto.getSession()
                );

        if (exists) {
            throw new RuntimeException("Milk already entered for this cattle and session");
        }

        // 4. Save per-cattle milk entry (RAW DATA)
        CattleMilkEntry entry = CattleMilkEntry.builder()
                .cattle(cattle)
                .farm(farm)
                .recordDate(today)
                .session(dto.getSession())
                .milkLiters(dto.getMilkLiters())
                .enteredBy(loggedInUser)
                .build();

        cattleMilkEntryRepository.save(entry);

        // 5. Update / upsert farm-level inventory (AGGREGATED DATA)
        updateMilkInventory(farm, today, dto.getSession());
    }
    private void updateMilkInventory(Farm farm, LocalDate date, MilkSession session) {

        Double totalMilk = cattleMilkEntryRepository
                .sumMilkByFarmAndDateAndSession(farm.getId(), date, session);

        MilkInventory inventory = milkInventoryRepository
                .findByFarmIdAndRecordDateAndSession(farm.getId(), date, session)
                .orElse(
                        MilkInventory.builder()
                                .farm(farm)
                                .recordDate(date)
                                .session(session)
                                .build()
                );

        inventory.setMilkLiters(totalMilk);
        milkInventoryRepository.save(inventory);
    }

}
