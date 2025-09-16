local function onTouch(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
        local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
        if humanoid then
            local currentHealth = humanoid.Health
            humanoid.Health = math.max(currentHealth - 25, 0)  -- Decrease health by 25 points
        end
    end
end

script.Parent.Touched:Connect(onTouch)