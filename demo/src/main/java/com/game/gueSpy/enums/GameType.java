package com.game.gueSpy.enums;

/**
 * Identifies which game a session belongs to. Used to route a session to the
 * matching GameEngine implementation. GueSpy (the word-based spy game) is the
 * only game today; new games add a value here plus a GameEngine bean.
 */
public enum GameType {
    GUESPY
}
