package com.example.backend.Service;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.DTO.MilkHistoryDto;
import com.example.backend.DTO.TodayMilkBreakdownDto;
import com.example.backend.DTO.TodayMilkEntryDto;
import com.example.backend.Entity.User;
import jakarta.persistence.Cacheable;

public interface MilkInventoryService {

    void addTodayMilk(AddMilkInventoryRequestDto dto, User loggedInUser);
    Double getTodayTotal(Long farmId);
    TodayMilkBreakdownDto getTodayBreakdown(Long farmId);


    TodayMilkBreakdownDto getTodayBreakdownForFarm(Long farmId);

    java.util.List<MilkHistoryDto> getLastNDaysMilk(Long farmId, int days);
    java.util.List<TodayMilkEntryDto> getTodayEntries(Long farmId, User user);
}

