package com.game.gueSpy.dto.response;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.Group;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=true)
@AllArgsConstructor
public class DisplayGroupResponse extends GenericResponse{
    private Group group;
    
}
