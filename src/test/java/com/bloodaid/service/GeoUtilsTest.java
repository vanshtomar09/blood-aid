package com.bloodaid.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class GeoUtilsTest {

    @Test
    void samePointIsZeroKilometres() {
        assertEquals(0.0, GeoUtils.haversineKm(28.6139, 77.2090, 28.6139, 77.2090), 0.001);
    }

    @Test
    void delhiToMumbaiIsAboutElevenHundredFortyEightKilometres() {
        double km = GeoUtils.haversineKm(28.6139, 77.2090, 19.0760, 72.8777);
        assertEquals(1148.0, km, 20.0);
    }
}
