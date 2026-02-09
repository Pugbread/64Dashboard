# 64Dashboard - Roblox Analytics

A self-hosted analytics dashboard for Roblox games. Track DAU, revenue, session time, and more.

## Quick Start

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `API_KEY` | Global API key for game server events | Yes |
| `ADMIN_PASSWORD` | Password to access the dashboard | Yes |
| `JWT_SECRET` | Secret for signing auth tokens | Yes |
| `PORT` | Server port (default: 3000) | No |

### Roblox Integration

Add this module to your Roblox game (ServerScript):

```lua
local HttpService = game:GetService("HttpService")

local Analytics = {}
Analytics.API_URL = "https://YOUR-APP.up.railway.app/api/events"
Analytics.API_KEY = "YOUR-API-KEY"
Analytics.GAME_ID = "YOUR-GAME-UUID"  -- from the dashboard Games page

local function send(endpoint, data)
    pcall(function()
        HttpService:RequestAsync({
            Url = Analytics.API_URL .. endpoint,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["x-api-key"] = Analytics.API_KEY
            },
            Body = HttpService:JSONEncode(data)
        })
    end)
end

function Analytics:SessionStart(player)
    send("/session-start", {
        gameId = self.GAME_ID,
        playerId = tostring(player.UserId)
    })
end

function Analytics:SessionEnd(player)
    send("/session-end", {
        gameId = self.GAME_ID,
        playerId = tostring(player.UserId)
    })
end

function Analytics:Purchase(player, productType, productId, productName, priceRobux)
    send("/purchase", {
        gameId = self.GAME_ID,
        playerId = tostring(player.UserId),
        productType = productType,  -- "gamepass" or "devproduct"
        productId = tostring(productId),
        productName = productName,
        priceRobux = priceRobux
    })
end

function Analytics:CustomEvent(player, eventName, eventData)
    send("/custom", {
        gameId = self.GAME_ID,
        playerId = tostring(player.UserId),
        eventName = eventName,
        eventData = eventData or {}
    })
end

-- Hook into player events
game.Players.PlayerAdded:Connect(function(player)
    Analytics:SessionStart(player)
end)

game.Players.PlayerRemoving:Connect(function(player)
    Analytics:SessionEnd(player)
end)

return Analytics
```

### Adding Custom Stats

Create a new file in `server/src/stats/providers/`, implement the `StatProvider` interface, and register it in `registry.ts`:

```typescript
import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const myCustomProvider: StatProvider = {
  id: 'my_custom_stat',
  name: 'My Custom Stat',
  category: 'engagement',
  resultType: 'timeseries',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as value
       FROM custom_events
       WHERE game_id = $1 AND event_name = 'my_event'
         AND created_at >= $2 AND created_at < $3
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map(r => ({
        date: r.date.toISOString().split('T')[0],
        value: Number(r.value),
      })),
    };
  },
};
```

Then add to `registry.ts`:
```typescript
import { myCustomProvider } from './providers/myCustomStat';
registry.register(myCustomProvider);
```
