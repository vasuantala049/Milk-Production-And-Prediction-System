package com.example.backend.Service.impl;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.DTO.MilkAvailabilityDto;
import com.example.backend.DTO.MilkHistoryDto;
import com.example.backend.DTO.TodayMilkBreakdownDto;
import com.example.backend.DTO.TodayMilkEntryDto;
import com.example.backend.Entity.*;
import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.CattleMilkEntryRepository;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.MilkAllocationRepository;
import com.example.backend.Repository.MilkInventoryRepository;
import com.example.backend.Service.MilkInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
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
        private final FarmRepository farmRepository;
        private final MilkAllocationRepository milkAllocationRepository;
        private final com.example.backend.Repository.FarmWorkerRepository farmWorkerRepository;

        @Override
        @org.springframework.cache.annotation.Caching(evict = {
                        @org.springframework.cache.annotation.CacheEvict(value = "todayMilkBreakdown", key = "#dto.farmId")
        })
        public void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser) {

                // 1. Resolve farm from logged-in user (DO NOT trust request)
                Farm farm;

                if (loggedInUser.getRole() == UserRole.WORKER) {

                        java.util.Optional<com.example.backend.Entity.FarmWorker> assignment = farmWorkerRepository
                                        .findByFarmIdAndWorkerId(dto.getFarmId(), loggedInUser.getId());
                        if (!assignment.isPresent()) {
                                throw new RuntimeException("Worker not assigned to this farm");
                        }

                        farm = farmRepository
                                        .findById(dto.getFarmId())
                                        .orElseThrow(() -> new RuntimeException("Farm not found"));

                } else if (loggedInUser.getRole() == UserRole.FARM_OWNER) {

                        farm = farmRepository
                                        .findByIdAndOwnerId(dto.getFarmId(), loggedInUser.getId())
                                        .orElseThrow(() -> new RuntimeException("Farm does not belong to owner"));

                } else {
                        throw new RuntimeException("Unauthorized role");
                }

                // 2. Find cattle using farm + tagId (correct way)
                Cattle cattle = cattleRepository
                                .findByFarm_IdAndTagId(farm.getId(), dto.getTagId().trim())
                                .orElseThrow(() -> new RuntimeException("Invalid tagId for this farm"));

                // 1.a Ensure cattle is active before accepting milk entries
                if (cattle.getStatus() == null || !"ACTIVE".equalsIgnoreCase(cattle.getStatus())) {
                        throw new IllegalArgumentException("Cannot add milk for cattle that is not ACTIVE");
                }

                LocalDate today = LocalDate.now();

                // 3. Prevent duplicate entry PER CATTLE PER SESSION
                boolean exists = cattleMilkEntryRepository
                                .existsByCattleIdAndRecordDateAndSession(
                                                cattle.getId(),
                                                today,
                                                dto.getSession());

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
                                                                .build());

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

        @Cacheable(value = "todayMilkBreakdown", key = "#farmId")
        @Override
        public TodayMilkBreakdownDto getTodayBreakdown(Long farmId) {
                LocalDate today = LocalDate.now();

                Double morning = milkInventoryRepository
                                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.MORNING)
                                .map(MilkInventory::getMilkLiters)
                                .orElse(0.0);

                Double evening = milkInventoryRepository
                                .findByFarmIdAndRecordDateAndSession(farmId, today, MilkSession.EVENING)
                                .map(MilkInventory::getMilkLiters)
                                .orElse(0.0);

                return new TodayMilkBreakdownDto(morning, evening);
        }

        @Override
        public java.util.List<MilkHistoryDto> getLastNDaysMilk(Long farmId, int days) {
                LocalDate today = LocalDate.now();
                LocalDate fromDate = today.minusDays(days - 1);

                java.util.List<Object[]> rows = milkInventoryRepository.findDailyTotals(farmId, fromDate);
                java.util.Map<LocalDate, Double> map = new java.util.HashMap<>();
                for (Object[] r : rows) {
                        LocalDate d = (LocalDate) r[0];
                        Double tot = (Double) r[1];
                        map.put(d, tot == null ? 0.0 : tot);
                }

                java.util.List<MilkHistoryDto> result = new java.util.ArrayList<>();
                for (int i = 0; i < days; i++) {
                        LocalDate d = fromDate.plusDays(i);
                        Double t = map.getOrDefault(d, 0.0);
                        result.add(new MilkHistoryDto(d, t));
                }
                return result;
        }

        @Override
        public java.util.List<TodayMilkEntryDto> getTodayEntries(Long farmId, User user) {
                LocalDate today = LocalDate.now();

                java.util.List<CattleMilkEntry> entries;

                if (user.getRole() == UserRole.WORKER) {
                        // only entries entered by this worker for the given farm
                        entries = cattleMilkEntryRepository
                                        .findByFarm_IdAndRecordDateAndEnteredBy_Id(farmId, today, user.getId());
                } else {
                        // owners/other roles get all entries for the farm
                        entries = cattleMilkEntryRepository
                                        .findByFarm_IdAndRecordDate(farmId, today);
                }

                return entries.stream()
                                .map(entry -> new TodayMilkEntryDto(
                                                entry.getCattle().getTagId(),
                                                entry.getCattle().getTagId(),
                                                entry.getSession(),
                                                entry.getMilkLiters(),
                                                entry.getEnteredBy() != null ? entry.getEnteredBy().getName() : null))
                                .collect(java.util.stream.Collectors.toList());
        }

        @Override
        public MilkAvailabilityDto getAvailability(Long farmId, LocalDate date, MilkSession session) {
                if (session == MilkSession.ALL) {
                        java.util.List<MilkInventory> inventories = milkInventoryRepository
                                        .findByFarmIdAndRecordDate(farmId, date);
                        double totalProd = 0;
                        double totalAlloc = 0;
                        for (MilkInventory inv : inventories) {
                                totalProd += inv.getMilkLiters();
                                totalAlloc += milkAllocationRepository.sumAllocationsByInventoryId(inv.getId());
                        }
                        return new MilkAvailabilityDto(totalProd, totalAlloc, totalProd - totalAlloc);
                }

                MilkInventory inventory = milkInventoryRepository
                                .findByFarmIdAndRecordDateAndSession(farmId, date, session)
                                .orElseThrow(() -> new IllegalStateException(
                                                "Milk inventory not found for " + session));

                Double totalProduction = inventory.getMilkLiters();
                Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
                Double availableMilk = totalProduction - allocatedMilk;

                return new MilkAvailabilityDto(totalProduction, allocatedMilk, availableMilk);
        }

        @Override
        public Double getAvailableMilk(Long inventoryId) {
                MilkInventory inventory = milkInventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new IllegalStateException("Inventory not found"));

                Double totalProduction = inventory.getMilkLiters();
                Double allocatedMilk = milkAllocationRepository.sumAllocationsByInventoryId(inventoryId);
                return totalProduction - allocatedMilk;
        }

}
