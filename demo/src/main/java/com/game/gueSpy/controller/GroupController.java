package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.dto.request.SelectionRequest;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.GroupService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping(
        path = "/create",
        name = "Create the group",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody GroupRequest request){
        return groupService.createNewGroup(request, principal.userId());
    }

    @GetMapping(
        path = "/get",
        name = "Create the group",
        produces = "application/json"
    )
    public ResponseEntity<?> get(@AuthenticationPrincipal UserPrincipal principal, @RequestParam(required = false) Long groupId){
        return groupService.getAllGroupForTheUser(principal.userId(), groupId);
    }

    @PostMapping(
        path = "/select",
        name = "select the group",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody SelectionRequest request){
        return groupService.selectGroup(principal.userId(), request.getId());
    }
}
