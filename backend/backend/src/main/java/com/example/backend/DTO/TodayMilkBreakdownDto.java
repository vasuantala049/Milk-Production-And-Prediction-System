package com.example.backend.DTO;

public class TodayMilkBreakdownDto {
    private Double morning;
    private Double evening;

    public TodayMilkBreakdownDto() {}

    public TodayMilkBreakdownDto(Double morning, Double evening) {
        this.morning = morning;
        this.evening = evening;
    }

    public Double getMorning() { return morning; }
    public void setMorning(Double morning) { this.morning = morning; }

    public Double getEvening() { return evening; }
    public void setEvening(Double evening) { this.evening = evening; }
}
