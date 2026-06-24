import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { WeatherCondition } from "@/lib/weatherService";

interface TiltCardProps {
    children: React.ReactNode;
    theme: "light" | "dark";
    weatherCondition?: WeatherCondition;
    onClick?: () => void;
    className?: string;
}

export default function TiltCard({ children, theme, weatherCondition, onClick, className = "" }: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Mouse position tracking
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Smooth physics
    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    // Dynamic Lighting Effect based on Weather
    const getLightingOverlay = () => {
        if (!weatherCondition) return null;

        // Base styles for the light beam
        const overlayClass = "absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-700 z-0";

        switch (weatherCondition) {
            case "Clear":
                // Intense sunbeam from top right
                if (theme === "dark") {
                    return (
                        <div className={`${overlayClass} opacity-100`} style={{
                            background: "radial-gradient(circle at 85% 15%, rgba(255,215,0,0.4) 0%, rgba(255,140,0,0.1) 40%, rgba(0,0,0,0) 70%)",
                            mixBlendMode: "color-dodge"
                        }} />
                    );
                } else {
                    return (
                        <div className={`${overlayClass} opacity-100`} style={{
                            background: "radial-gradient(circle at 85% 15%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0) 70%)",
                            mixBlendMode: "overlay"
                        }} />
                    );
                }
            case "Rain":
                // Darker, moody blue wash with strong diagonal rain-like streaks
                return (
                    <div className={`${overlayClass} opacity-100`} style={{
                        background: theme === "dark" 
                            ? "linear-gradient(135deg, rgba(20,40,80,0.8) 0%, rgba(10,20,40,0.4) 50%, rgba(0,0,0,0) 100%)"
                            : "linear-gradient(135deg, rgba(80,120,180,0.5) 0%, rgba(200,220,240,0.2) 50%, rgba(255,255,255,0) 100%)",
                        mixBlendMode: theme === "dark" ? "hard-light" : "multiply"
                    }} />
                );
            case "Cloudy":
            case "Windy":
                // Strong diffuse frosted glow
                return (
                    <div className={`${overlayClass} opacity-80`} style={{
                        background: theme === "dark"
                            ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 80%)"
                            : "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0) 80%)",
                        mixBlendMode: theme === "dark" ? "screen" : "multiply"
                    }} />
                );
            case "Snow":
                // Crisp white frost from corners
                return (
                    <div className={`${overlayClass} opacity-100`} style={{
                        background: theme === "dark"
                            ? "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0) 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0) 50%)"
                            : "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 50%)",
                        mixBlendMode: theme === "dark" ? "color-dodge" : "overlay"
                    }} />
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onClick={onClick}
            className={`relative z-10 max-w-2xl mx-auto backdrop-blur-xl rounded-3xl border transform-gpu preserve-3d transition-shadow duration-500 cursor-pointer ${className}`}
        >
            {getLightingOverlay()}
            <div className="relative z-10 h-full w-full pointer-events-none">
                <div className="pointer-events-auto">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
