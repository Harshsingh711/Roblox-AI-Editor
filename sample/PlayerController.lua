-- PlayerController.lua
-- Handles player movement and input

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local PlayerController = {}
PlayerController.__index = PlayerController

-- Configuration
local WALK_SPEED = 16
local RUN_SPEED = 24
local JUMP_POWER = 50

function PlayerController.new(player)
    local self = setmetatable({}, PlayerController)
    
    self.player = player
    self.character = player.Character or player.CharacterAdded:Wait()
    self.humanoid = self.character:WaitForChild("Humanoid")
    self.rootPart = self.character:WaitForChild("HumanoidRootPart")
    
    self.isRunning = false
    self.isJumping = false
    
    self:setupConnections()
    return self
end

function PlayerController:setupConnections()
    -- Handle character respawning
    self.player.CharacterAdded:Connect(function(character)
        self.character = character
        self.humanoid = character:WaitForChild("Humanoid")
        self.rootPart = character:WaitForChild("HumanoidRootPart")
        self:resetState()
    end)
    
    -- Input handling
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end
        
        if input.KeyCode == Enum.KeyCode.LeftShift then
            self:startRunning()
        elseif input.KeyCode == Enum.KeyCode.Space then
            self:jump()
        end
    end)
    
    UserInputService.InputEnded:Connect(function(input, gameProcessed)
        if gameProcessed then return end
        
        if input.KeyCode == Enum.KeyCode.LeftShift then
            self:stopRunning()
        end
    end)
    
    -- Update loop
    RunService.Heartbeat:Connect(function()
        self:update()
    end)
end

function PlayerController:startRunning()
    self.isRunning = true
    self.humanoid.WalkSpeed = RUN_SPEED
end

function PlayerController:stopRunning()
    self.isRunning = false
    self.humanoid.WalkSpeed = WALK_SPEED
end

function PlayerController:jump()
    if self.humanoid.FloorMaterial ~= Enum.Material.Air then
        self.humanoid.JumpPower = JUMP_POWER
        self.humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
        self.isJumping = true
        
        -- Reset jump power after jump
        spawn(function()
            wait(0.1)
            self.humanoid.JumpPower = 50
        end)
    end
end

function PlayerController:resetState()
    self.isRunning = false
    self.isJumping = false
    self.humanoid.WalkSpeed = WALK_SPEED
    self.humanoid.JumpPower = 50
end

function PlayerController:update()
    -- Add any per-frame updates here
    -- For example, checking if player is on ground
    if self.humanoid.FloorMaterial ~= Enum.Material.Air then
        self.isJumping = false
    end
end

-- Initialize for all players
Players.PlayerAdded:Connect(function(player)
    PlayerController.new(player)
end)

-- Initialize for existing players
for _, player in pairs(Players:GetPlayers()) do
    PlayerController.new(player)
end

return PlayerController 