-- DashScript.lua

local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoidRootPart = character:WaitForChild('HumanoidRootPart')

local dashCooldown = 4 -- Cooldown in seconds
local canDash = true
local jumpCount = 0
local maxJumps = 2 -- Allow double jump

-- Function to handle dashing
local function dash()
    if canDash then
        canDash = false
        local originalPosition = humanoidRootPart.Position
        local dashDirection = humanoidRootPart.CFrame.LookVector * 20 -- Dash distance
        humanoidRootPart.CFrame = humanoidRootPart.CFrame + dashDirection

        wait(0.1) -- Dash duration
        humanoidRootPart.CFrame = originalPosition -- Return to original position

        wait(dashCooldown) -- Cooldown period
        canDash = true
    end
end

-- Function to handle jumping
local function onJump()
    if jumpCount < maxJumps then
        jumpCount = jumpCount + 1
        humanoidRootPart.Velocity = Vector3.new(humanoidRootPart.Velocity.X, 50, humanoidRootPart.Velocity.Z) -- Adjust jump force
    end
end

-- Connect the dash function to the Q key
local UserInputService = game:GetService('UserInputService')
UserInputService.InputBegan:Connect(function(input, gameProcessedEvent)
    if not gameProcessedEvent and input.KeyCode == Enum.KeyCode.Q then
        dash()
    elseif input.UserInputType == Enum.UserInputType.Keyboard and input.KeyCode == Enum.KeyCode.Space then
        onJump()
    end
end)

-- Reset jump count when player lands
character.Humanoid.StateChanged:Connect(function(_, newState)
    if newState == Enum.HumanoidStateType.Freefall then
        jumpCount = 0
    end
end)