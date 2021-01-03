import {Router, Request, Response} from 'express';
import { v4 } from 'uuid';
import {FeedItem} from '../models/FeedItem';
import {NextFunction} from 'connect';
import * as jwt from 'jsonwebtoken';
import * as AWS from '../../../../aws';
import * as c from '../../../../config/config';

const router: Router = Router();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers || !req.headers.authorization) {
    return res.status(401).send({message: 'No authorization headers.'});
  }

  const tokenBearer = req.headers.authorization.split(' ');
  if (tokenBearer.length != 2) {
    return res.status(401).send({message: 'Malformed token.'});
  }

  const token = tokenBearer[1];
  return jwt.verify(token, c.config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(500).send({auth: false, message: 'Failed to authenticate.'});
    }
    return next();
  });
}

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
  const pid = v4();
  console.log(`START - GET - ${new Date().toLocaleString()} - ${pid} - /feed`);

  const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
  items.rows.map((item) => {
    if (item.url) {
      item.url = AWS.getGetSignedUrl(item.url);
    }
  });

  console.log(`END - GET - ${new Date().toLocaleString()} - ${pid} - /feed`);
  res.send(items);
});

// Get a feed resource
router.get('/:id',
    async (req: Request, res: Response) => {
      const pid = v4();
      const {id} = req.params;
      console.log(`START - GET - ${new Date().toLocaleString()} - ${pid} - /feed/${id}`);
      const item = await FeedItem.findByPk(id);
      console.log(`END - GET - ${new Date().toLocaleString()} - ${pid} - /feed/${id}`);
      res.send(item);
    });

// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName',
    requireAuth,
    async (req: Request, res: Response) => {
      const pid = v4();
      const {fileName} = req.params;
      console.log(`START - GET - ${new Date().toLocaleString()} - ${pid} - /feed/signed-url/${fileName}`);
      const url = AWS.getPutSignedUrl(fileName);
      console.log(`END - GET - ${new Date().toLocaleString()} - ${pid} - /feed/signed-url/${fileName}`);
      res.status(201).send({url: url});
    });

// Create feed with metadata
router.post('/',
    requireAuth,
    async (req: Request, res: Response) => {
      const pid = v4();
      console.log(`START - POST - ${new Date().toLocaleString()} - ${pid} - /feed`);
      const caption = req.body.caption;
      const fileName = req.body.url; // same as S3 key name

      if (!caption) {
        console.log(`END - POST - ${new Date().toLocaleString()} - ${pid} - /feed`);
        return res.status(400).send({message: 'Caption is required or malformed.'});
      }

      if (!fileName) {
        console.log(`END - POST - ${new Date().toLocaleString()} - ${pid} - /feed`);
        return res.status(400).send({message: 'File url is required.'});
      }

      const item = await new FeedItem({
        caption: caption,
        url: fileName,
      });

      const savedItem = await item.save();

      savedItem.url = AWS.getGetSignedUrl(savedItem.url);

      console.log(`END - POST - ${new Date().toLocaleString()} - ${pid} - /feed`);
      res.status(201).send(savedItem);
    });

export const FeedRouter: Router = router;
