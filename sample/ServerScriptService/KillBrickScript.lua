-- KillBrickScript.lua

local KillBrick = script.Parent

-- Function to handle player contact
local function onTouch(other)
    local player = game.Players:GetPlayerFromCharacter(other)
    if player then
        local character = player.Character
        if character and character:FindFirstChild('Humanoid') then
            local humanoid = character.Humanoid
            humanoid.Health = math.max(humanoid.Health - 25, 0) -- Reduce health by 25, but not below 0
        end
    end
end

-- Connect the onTouch function to the Touched event
KillBrick.Touched:Connect(onTouch)