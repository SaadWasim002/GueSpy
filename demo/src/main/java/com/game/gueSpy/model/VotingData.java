package com.game.gueSpy.model;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VotingData {
    private Map<Integer, Integer> votes;
    private List<Integer> playersVotedOut;
}
