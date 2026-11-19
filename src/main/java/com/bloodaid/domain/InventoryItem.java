package com.bloodaid.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "blood_inventory")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_id", nullable = false)
    private Long bankId;

    @Column(name = "blood_type", nullable = false)
    private String bloodType;

    @Column(name = "units", nullable = false)
    private int units;

    protected InventoryItem() {
    }

    public InventoryItem(Long bankId, String bloodType, int units) {
        this.bankId = bankId;
        this.bloodType = bloodType;
        this.units = units;
    }

    public Long getId() {
        return id;
    }

    public Long getBankId() {
        return bankId;
    }

    public String getBloodType() {
        return bloodType;
    }

    public int getUnits() {
        return units;
    }

    public void setUnits(int units) {
        this.units = units;
    }
}
