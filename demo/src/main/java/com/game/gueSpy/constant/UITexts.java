package com.game.gueSpy.constant;

public class UITexts {
    public static final String SPY_TEXT = "You are SPY";
    public static final String NON_SPY_TEXT = "You are NOT a SPY";
    public static final String PASS_DEVICE = "Pass the device to ";


    public static final String VOTING_HEADER = "Voting Time";
    public static final String VOTING_TEXT = "Choose one player who you think is the spy";

    public static String getPassDeviceText(String playerName){
        return PASS_DEVICE + playerName;
    }
}
