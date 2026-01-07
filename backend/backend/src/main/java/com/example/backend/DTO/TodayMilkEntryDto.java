package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import lombok.Getter;

@Getter
public class TodayMilkEntryDto {

    private String cattleTagId;
    private String cattleName;
    private MilkSession session;
    private Double milkLiters;

    public TodayMilkEntryDto() {
    }

    public TodayMilkEntryDto(String cattleTagId, String cattleName, MilkSession session, Double milkLiters) {
        this.cattleTagId = cattleTagId;
        this.cattleName = cattleName;
        this.session = session;
        this.milkLiters = milkLiters;
    }

    public void setCattleTagId(String cattleTagId) {
        this.cattleTagId = cattleTagId;
    }

    public void setCattleName(String cattleName) {
        this.cattleName = cattleName;
    }

    public void setSession(MilkSession session) {
        this.session = session;
    }

    public void setMilkLiters(Double milkLiters) {
        this.milkLiters = milkLiters;
    }
}

