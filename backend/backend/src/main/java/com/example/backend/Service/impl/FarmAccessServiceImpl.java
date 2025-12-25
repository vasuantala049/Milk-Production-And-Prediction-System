package com.example.backend.Service.impl;

import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Service.FarmAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FarmAccessServiceImpl implements FarmAccessService {

    private final CattleRepository cattleRepository;

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
            if (user.getAssignedFarm() == null) {
                throw new IllegalArgumentException("Worker not assigned to any farm");
            }
            if (!user.getAssignedFarm().getId().equals(cattleFarm.getId())) {
                throw new IllegalArgumentException("Worker not assigned to this farm");
            }
            outCattleHolder[0] = cattle;
            return cattleFarm;
        }

        throw new IllegalStateException("Unsupported role");
    }
}
