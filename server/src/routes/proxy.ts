import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/proxy/game-icon/:universeId - Proxy Roblox game icon
router.get('/game-icon/:universeId', async (req: Request, res: Response) => {
  try {
    const { universeId } = req.params;
    const size = (req.query.size as string) || '150x150';

    const apiUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=${size}&format=Png&isCircular=false`;

    const response = await fetch(apiUrl);
    const data: any = await response.json();

    if (data?.data?.[0]?.imageUrl) {
      res.json({ imageUrl: data.data[0].imageUrl });
    } else {
      res.json({ imageUrl: null });
    }
  } catch (error) {
    console.error('Error proxying game icon:', error);
    res.json({ imageUrl: null });
  }
});

// GET /api/proxy/game-info/:universeId - Proxy Roblox game info
router.get('/game-info/:universeId', async (req: Request, res: Response) => {
  try {
    const { universeId } = req.params;
    const apiUrl = `https://games.roblox.com/v1/games?universeIds=${universeId}`;

    const response = await fetch(apiUrl);
    const data: any = await response.json();

    if (data?.data?.[0]) {
      const game = data.data[0];
      res.json({
        name: game.name,
        description: game.description,
        playing: game.playing,
        visits: game.visits,
        maxPlayers: game.maxPlayers,
        created: game.created,
        updated: game.updated,
        favoritedCount: game.favoritedCount,
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error proxying game info:', error);
    res.json(null);
  }
});

// GET /api/proxy/product-icons?ids=1,2,3&type=devproduct|gamepass
router.get('/product-icons', async (req: Request, res: Response) => {
  try {
    const ids = String(req.query.ids || '');
    const productType = String(req.query.type || 'devproduct');

    if (!ids) {
      res.json({});
      return;
    }

    let apiUrl: string;
    if (productType === 'gamepass') {
      apiUrl = `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${ids}&size=150x150&format=Png&isCircular=false`;
    } else {
      apiUrl = `https://thumbnails.roblox.com/v1/developer-products/icons?developerProductIds=${ids}&size=150x150&format=Png&isCircular=false`;
    }

    const response = await fetch(apiUrl);
    const data: any = await response.json();

    const iconMap: Record<string, string | null> = {};
    if (Array.isArray(data?.data)) {
      for (const item of data.data) {
        iconMap[String(item.targetId)] = item.imageUrl || null;
      }
    }

    res.json(iconMap);
  } catch (error) {
    console.error('Error proxying product icons:', error);
    res.json({});
  }
});

export default router;
