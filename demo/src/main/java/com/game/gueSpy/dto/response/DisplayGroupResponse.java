package com.game.gueSpy.dto.response;

import com.game.gueSpy.entity.Group;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DisplayGroupResponse{
    private Group group;
    
}
