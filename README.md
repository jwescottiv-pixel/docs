# VoiceCandy

VoiceCandy is a mobile AI voice application that generates realistic speech from text and allows users to experiment with custom voice cloning. The app integrates modern AI voice technology into a full-stack mobile product, combining a React Native interface, backend API, and AI voice services.

## Overview

VoiceCandy demonstrates how AI APIs can be integrated into real-world applications. The project includes a mobile interface for generating voice audio, a backend server for API routing, and database architecture for private voice libraries and usage tracking.

## Key Features

- AI-powered text-to-speech generation
- Voice selection and cloned voice support
- Voice Vault for saving generated audio
- Mobile interface built with React Native (Expo)
- Node.js + Express backend for AI API integration
- Supabase database architecture for user accounts and private voice libraries
- Share-to-read functionality for converting text messages to speech

## Tech Stack

**Frontend**
- React Native
- Expo
- TypeScript

**Backend**
- Node.js
- Express

**AI Integration**
- ElevenLabs Voice AI API

**Database / Auth**
- Supabase

**Infrastructure**
- Railway deployment
- GitHub Codespaces

## Architecture

Mobile App (React Native) ↓ Express API Server ↓ Supabase Database ↓ ElevenLabs Voice AI
This architecture enables scalable AI voice generation while supporting private user voice libraries and usage tracking.

## Purpose

VoiceCandy explores building a scalable AI-powered mobile product that combines voice synthesis, personalized voice cloning, and backend data architecture to manage user-specific AI resources.

## Status

Active development. Current work includes:

- Supabase user authentication
- Private voice ownership per user
- Usage tracking and tiered access
- Scalable AI voice generation workflows
