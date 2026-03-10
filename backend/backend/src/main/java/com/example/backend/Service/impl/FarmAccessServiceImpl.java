package com.example.backend.Service.impl;

import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Service.FarmAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FarmAccessServiceImpl implements FarmAccessService {

    private final CattleRepository cattleRepository;
    private final FarmRepository farmRepository;

    @Override
    public Farm resolveFarmForMilk(User user, String tagId, Cattle[] outCattleHolder) {

        if (user.getRole() == UserRole.BUYER) {
            throw new IllegalArgumentException("Buyers cannot add milk");
        }

        Cattle cattle = cattleRepository.findByTagId(tagId.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid tagId"));

        Farm cattleFarm = cattle.getFarm();

        if (user.getRole() == UserRole.FARM_OWNER) {
            if (cattleFarm.getOwner() == null || !cattleFarm.getOwner().getId().equals(user.getId())) {
                throw new IllegalArgumentException("User does not own this farm");
            }
            outCattleHolder[0] = cattle;
            return cattleFarm;
        }

        // WORKER
        if (user.getRole() == UserRole.WORKER) {
            if (user.getFarms() == null || user.getFarms().isEmpty()) {
                throw new IllegalArgumentException("Worker not assigned to any farm");
            }
            boolean hasAccess = user.getFarms().stream()
                    .anyMatch(f -> f.getId().equals(cattleFarm.getId()));
            if (!hasAccess) {
                throw new IllegalArgumentException("Worker not assigned to this farm");
            }
            outCattleHolder[0] = cattle;
            return cattleFarm;
        }

        throw new IllegalStateException("Unsupported role");
    }

    @Override
    public void verifyFarmAccess(User user, Long farmId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        // Check if user is the owner
        if (user.getRole() == UserRole.FARM_OWNER && farm.getOwner().getId().equals(user.getId())) {
            return;
        }

        // Check if user is an assigned worker
        if (user.getRole() == UserRole.WORKER) {
            boolean hasAccess = user.getFarms() != null &&
                    user.getFarms().stream()
                            .anyMatch(f -> f.getId().equals(farmId));
            if (hasAccess) {
                return;
            }
        }

        throw new IllegalArgumentException("Access denied: You are not authorized to view this farm's data");
    }
}
