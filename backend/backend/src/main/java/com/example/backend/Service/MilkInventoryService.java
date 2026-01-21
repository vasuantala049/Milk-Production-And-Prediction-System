package com.example.backend.Service;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.DTO.MilkAvailabilityDto;
import com.example.backend.DTO.MilkHistoryDto;
import com.example.backend.DTO.TodayMilkBreakdownDto;
import com.example.backend.DTO.TodayMilkEntryDto;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.MilkSession;

import java.time.LocalDate;
import jakarta.persistence.Cacheable;

public interface MilkInventoryService {

    void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser);
    Double getTodayTotal(Long farmId);
    TodayMilkBreakdownDto getTodayBreakdown(Long farmId);




    java.util.List<MilkHistoryDto> getLastNDaysMilk(Long farmId, int days);
    java.util.List<TodayMilkEntryDto> getTodayEntries(Long farmId, User user);
    
    // New methods for availability tracking
    MilkAvailabilityDto getAvailability(Long farmId, LocalDate date, MilkSession session);
    Double getAvailableMilk(Long inventoryId);
}

