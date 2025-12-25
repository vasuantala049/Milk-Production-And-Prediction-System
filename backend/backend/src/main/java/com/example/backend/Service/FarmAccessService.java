package com.example.backend.Service;

import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;

public interface FarmAccessService {
    /**
     * Resolve the farm and cattle for a milk entry request and verify access.
     * Returns the farm; also sets outCattleHolder[0] to the resolved Cattle.
     * Throws IllegalArgumentException with clear messages on access errors.
     */
    Farm resolveFarmForMilk(User user, String tagId, Cattle[] outCattleHolder);
}
