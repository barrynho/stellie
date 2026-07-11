-- ==========================================
-- LOVE CONTRACT DATABASE SCHEMA (PostgreSQL)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if you need to start fresh (CAUTION: deletes all data)
-- DROP TABLE IF EXISTS partner_signatures;
-- DROP TABLE IF EXISTS contracts;
-- DROP TABLE IF EXISTS users;

-- 1. Table users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Table contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    numero VARCHAR(50) UNIQUE NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    nom_createur VARCHAR(100) NOT NULL,
    prenom_createur VARCHAR(100) NOT NULL,
    email_createur VARCHAR(255) NOT NULL,
    telephone_createur VARCHAR(50),
    date_relation DATE NOT NULL,
    clauses TEXT NOT NULL,
    signature_createur TEXT NOT NULL, -- Base64 data URI of creator signature
    statut VARCHAR(20) DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Signe')),
    decision VARCHAR(20) DEFAULT 'pending' CHECK (decision IN ('pending', 'accepted', 'declined')),
    response_message TEXT,
    response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Table partner_signatures
CREATE TABLE IF NOT EXISTS partner_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    signature TEXT NOT NULL, -- Base64 data URI of partner signature
    date_signature TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
