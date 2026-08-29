// lib/hooks/useMatchData.ts
// আগে এখানে নিজস্ব onValue() লিসেনার ছিল — এখন শুধু শেয়ার্ড Context থেকে re-export করে,
// যাতে সব existing import (`@/lib/hooks/useMatchData`) অপরিবর্তিত থেকেও একটাই
// RTDB কানেকশন শেয়ার করে (আগে প্রতি কম্পোনেন্টে আলাদা লিসেনার তৈরি হতো)।
export { useMatchData } from "@/lib/context/MatchDataContext";
