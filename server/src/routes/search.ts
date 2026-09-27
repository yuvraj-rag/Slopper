import { Router, Request, Response, NextFunction } from 'express';
import { searchFoodsPaginated } from '../search/session';
import { ApiError } from '../middleware/errorHandler';

export const searchRouter = Router();

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

searchRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQuery = req.query.q;
    if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim() === '') {
      throw new ApiError(400, 'missing_query', 'Query parameter "q" is required and must not be empty');
    }

    const query = rawQuery.trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );

    try {
      const envelope = await searchFoodsPaginated(query, page, pageSize);
      res.status(200).json(envelope);
    } catch (err: any) {
      if (err.message === 'Both USDA and OFF APIs failed') {
        throw new ApiError(502, 'upstream_unavailable', 'Both USDA and OFF APIs failed');
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});
