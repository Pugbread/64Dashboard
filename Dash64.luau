--[[
	64's Dash - Analytics Module
	Place this ModuleScript in ServerScriptService.

	Usage:
		local Dash = require(path.to.this.module)

		Dash.Init()

		Dash.Purchase(player, "devproduct", "123456", "100 Coins", 99)
		Dash.Custom(player, "LevelUp", { level = 5, xp = 1200 })

	Failed HTTP requests are automatically queued in MemoryStoreService
	and retried every 10 seconds, so no event is ever lost.
--]]

local HttpService        = game:GetService("HttpService")
local Players            = game:GetService("Players")
local MemoryStoreService = game:GetService("MemoryStoreService")

local Dash = {}

local BASE_URL = "https://dashboard-production-6084.up.railway.app"
local API_KEY  = "rblx-64dash-api-key-2026"

local gameId = tostring(game.GameId)

local headers = {
	["Content-Type"] = "application/json",
	["x-api-key"]    = API_KEY,
}

------------------------------------------------------------------------
-- Queue setup  (invisibility timeout = 30s so retries don't overlap)
------------------------------------------------------------------------

local requestQueue = MemoryStoreService:GetQueue("Dash64_Retry", 30)
local QUEUE_ITEM_TTL  = 600   -- items expire after 10 minutes
local PROCESS_INTERVAL = 10   -- seconds between queue flushes
local BATCH_SIZE       = 5    -- max items to process per flush cycle

------------------------------------------------------------------------
-- Internal: raw HTTP POST — returns true on success, false on failure
------------------------------------------------------------------------

local function post(endpoint: string, body: { [string]: any }): boolean
	local ok, err = pcall(function()
		HttpService:RequestAsync({
			Url     = BASE_URL .. endpoint,
			Method  = "POST",
			Headers = headers,
			Body    = HttpService:JSONEncode(body),
		})
	end)
	if not ok then
		warn("[64's Dash] POST " .. endpoint .. " failed: " .. tostring(err))
	end
	return ok
end

------------------------------------------------------------------------
-- Internal: POST with queue fallback — if HTTP fails, push to queue
------------------------------------------------------------------------

local function postOrQueue(endpoint: string, body: { [string]: any })
	if post(endpoint, body) then
		return -- sent successfully
	end

	-- HTTP failed — enqueue for retry
	local queueOk, queueErr = pcall(function()
		requestQueue:AddAsync(
			{ endpoint = endpoint, body = body },
			QUEUE_ITEM_TTL
		)
	end)

	if queueOk then
		warn("[64's Dash] Queued for retry: " .. endpoint)
	else
		warn("[64's Dash] Queue fallback also failed: " .. tostring(queueErr))
	end
end

------------------------------------------------------------------------
-- Internal: queue processor — runs every PROCESS_INTERVAL seconds
------------------------------------------------------------------------

local function processQueue()
	for _ = 1, BATCH_SIZE do
		-- Read one item (don't block — 0s wait)
		local readOk, items, id = pcall(function()
			return requestQueue:ReadAsync(1, false, 0)
		end)

		if not readOk or not items or #items == 0 then
			return -- nothing left or read error
		end

		local item = items[1]
		if post(item.endpoint, item.body) then
			-- Success — remove from queue
			local removeOk, removeErr = pcall(function()
				requestQueue:RemoveAsync(id)
			end)
			if not removeOk then
				warn("[64's Dash] Queue remove failed: " .. tostring(removeErr))
			end
		else
			-- Still failing — stop this cycle.
			-- Item becomes visible again after invisibility timeout (30s).
			return
		end
	end
end

local function startQueueProcessor()
	task.spawn(function()
		while true do
			task.wait(PROCESS_INTERVAL)
			local ok, err = pcall(processQueue)
			if not ok then
				warn("[64's Dash] Queue processor error: " .. tostring(err))
			end
		end
	end)
end

------------------------------------------------------------------------
-- Public API
------------------------------------------------------------------------

function Dash.Init()
	startQueueProcessor()
	Dash.BindPlayers()
end

function Dash.SessionStart(player: Player)
	postOrQueue("/api/events/session-start", {
		gameId   = gameId,
		playerId = tostring(player.UserId),
	})
end

function Dash.SessionEnd(player: Player)
	postOrQueue("/api/events/session-end", {
		gameId   = gameId,
		playerId = tostring(player.UserId),
	})
end

function Dash.Purchase(
	player: Player,
	productType: string,
	productId: string,
	productName: string,
	priceRobux: number?
)
	postOrQueue("/api/events/purchase", {
		gameId      = gameId,
		playerId    = tostring(player.UserId),
		productType = productType,
		productId   = productId,
		productName = productName,
		priceRobux  = priceRobux or 0,
	})
end

function Dash.Custom(player: Player, eventName: string, eventData: { [string]: any }?)
	postOrQueue("/api/events/custom", {
		gameId    = gameId,
		playerId  = tostring(player.UserId),
		eventName = eventName,
		eventData = eventData or {},
	})
end

function Dash.BindPlayers()
	Players.PlayerAdded:Connect(function(player)
		Dash.SessionStart(player)
	end)

	Players.PlayerRemoving:Connect(function(player)
		Dash.SessionEnd(player)
	end)

	for _, player in Players:GetPlayers() do
		task.spawn(Dash.SessionStart, player)
	end

	game:BindToClose(function()
		for _, player in Players:GetPlayers() do
			task.spawn(Dash.SessionEnd, player)
		end
		-- Give HTTP + queue enough time to flush
		task.wait(3)
	end)
end

return Dash
