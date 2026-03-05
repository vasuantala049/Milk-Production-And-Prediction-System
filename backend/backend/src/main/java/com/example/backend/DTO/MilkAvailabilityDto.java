package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MilkAvailabilityDto {
    private Double totalProduction;  // Original milk production
    private Double allocatedMilk;    // Sum of all allocations
    private Double availableMilk;    // Total - Allocated
    
    private Double cowTotalProduction;
    private Double cowAllocatedMilk;
    private Double cowAvailableMilk;

    private Double buffaloTotalProduction;
    private Double buffaloAllocatedMilk;
    private Double buffaloAvailableMilk;
}
