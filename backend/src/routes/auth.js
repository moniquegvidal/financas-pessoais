import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {pool} from '../db.js';

const router=Router();
const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post('/usuarios', async(req,res)=>{
  try{
    const {nome,email,senha,confirmarSenha}=req.body;
    if(!nome?.trim()||!email?.trim()||!senha||!confirmarSenha) return res.status(400).json({erro:'Preencha todos os campos.'});
    if(!emailOk(email)) return res.status(400).json({erro:'Informe um e-mail válido.'});
    if(senha.length<6) return res.status(400).json({erro:'A senha deve ter pelo menos 6 caracteres.'});
    if(senha!==confirmarSenha) return res.status(400).json({erro:'As senhas não coincidem.'});
    const [exists]=await pool.query('SELECT id FROM usuarios WHERE email=?',[email.toLowerCase().trim()]);
    if(exists.length) return res.status(409).json({erro:'Este e-mail já está cadastrado.'});
    const hash=await bcrypt.hash(senha,12);
    const [r]=await pool.query('INSERT INTO usuarios(nome,email,senha_hash) VALUES(?,?,?)',[nome.trim(),email.toLowerCase().trim(),hash]);
    res.status(201).json({id:r.insertId,nome:nome.trim(),email:email.toLowerCase().trim()});
  }catch(e){console.error(e);res.status(500).json({erro:'Erro interno do servidor.'});}
});

router.post('/login',async(req,res)=>{
  try{
    const {email,senha}=req.body;
    const [rows]=await pool.query('SELECT * FROM usuarios WHERE email=?',[email?.toLowerCase().trim()]);
    if(!rows.length || !(await bcrypt.compare(senha||'',rows[0].senha_hash))) return res.status(401).json({erro:'E-mail ou senha inválidos.'});
    const u=rows[0], token=jwt.sign({id:u.id,nome:u.nome,email:u.email},process.env.JWT_SECRET,{expiresIn:'8h'});
    res.json({token,usuario:{id:u.id,nome:u.nome,email:u.email}});
  }catch(e){console.error(e);res.status(500).json({erro:'Erro interno do servidor.'});}
});
export default router;
