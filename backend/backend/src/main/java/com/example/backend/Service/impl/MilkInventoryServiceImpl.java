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
    private final com.example.backend.Service.FarmAccessService farmAccessService;

    @Override
    public void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser) {

                // 1. Resolve farm and cattle using access rules (owner vs worker)
                Cattle[] holder = new Cattle[1];
                Farm farm = farmAccessService.resolveFarmForMilk(loggedInUser, dto.getTagId(), holder);
                Cattle cattle = holder[0];


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

    @Override
    public Double getTodayTotal(Long farmId) {
        LocalDate today = LocalDate.now();

        Double morning = milkInventoryRepository
                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.MORNING)
                .map(MilkInventory::getMilkLiters)
                .orElse(0.0);

        Double evening = milkInventoryRepository
                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.EVENING)
                .map(MilkInventory::getMilkLiters)
                .orElse(0.0);

        return morning + evening;
    }
        @Override
        public com.example.backend.DTO.TodayMilkBreakdownDto getTodayBreakdown(Long farmId) {
                LocalDate today = LocalDate.now();

                Double morning = milkInventoryRepository
                                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.MORNING)
                                .map(MilkInventory::getMilkLiters)
                                .orElse(0.0);

                Double evening = milkInventoryRepository
                                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.EVENING)
                                .map(MilkInventory::getMilkLiters)
                                .orElse(0.0);

                return new com.example.backend.DTO.TodayMilkBreakdownDto(morning, evening);
        }

    

}
