import {Router} from 'express';
import {pool} from '../db.js';
import {auth} from '../middleware/auth.js';
const router=Router();
router.get('/',auth,async(req,res)=>{
  const [rows]=await pool.query('SELECT id,nome FROM categorias ORDER BY id');
  res.json(rows);
});
export default router;
