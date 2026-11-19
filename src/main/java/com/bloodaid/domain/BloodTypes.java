package com.bloodaid.domain;

import java.util.List;

public final class BloodTypes {

    /** Display order used everywhere in the app. */
    public static final List<String> ALL = List.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");

    private BloodTypes() {
    }

    public static boolean isValid(String type) {
        return type != null && ALL.contains(type);
    }
}
