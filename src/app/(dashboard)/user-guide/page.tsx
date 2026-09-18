'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Printer,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Sparkles,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Boxes,
  Users,
  BadgeDollarSign,
  Receipt,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  Building2,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  SlidersHorizontal,
  FileText,
  KeyRound,
  ExternalLink,
  Info,
} from 'lucide-react';

interface GuideSection {
  id: string;
  number: string;
  title: string;
  icon: any;
  category: string;
  keywords: string[];
  summary: string;
  content: React.ReactNode;
}

export default function UserGuidePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-intro');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll detection for back-to-top and active section
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  // Section definitions
  const sections: GuideSection[] = useMemo(
    () => [
      {
        id: 'sec-intro',
        number: '০১',
        title: 'সফটওয়্যারটির মূল উদ্দেশ্য ও সুপার এডমিনের ভূমিকা',
        icon: Sparkles,
        category: 'প্রাথমিক ধারণা',
        keywords: ['উদ্দেশ্য', 'ভূমিকা', 'সুপার এডমিন', 'ক্ষমতা', 'ম্যানেজার', 'এডমিন'],
        summary: 'সফটওয়্যারটি কী কাজ করে এবং সুপার এডমিন হিসেবে আপনার বিশেষ ক্ষমতা ও দায়িত্ব কী কী।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-600 dark:border-emerald-500 rounded-xs">
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                স্বাগতম! এই সফটওয়্যারটি আপনার ব্যবসা প্রতিষ্ঠানের একটি নিখুঁত ডিজিটাল খাতা। এটি এমনভাবে তৈরি করা হয়েছে যাতে কোনো বিশেষ কম্পিউটার প্রশিক্ষণ ছাড়াও যে কেউ খুব সহজে সব হিসাব পরিচালনা করতে পারেন।
              </p>
            </div>

            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400 flex items-center gap-2 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              এই সফটওয়্যার দিয়ে আপনি কী কী করতে পারবেন?
            </h4>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>লাইভ স্টক হিসাব:</strong> দোকানে বা গুদামে কোন পণ্য কত কার্টন বা কত পিস আছে তা মুহূর্তে দেখা।</li>
              <li><strong>ক্যাশ ও বাকির মেমো:</strong> পাইকারি ও খুচরা কাস্টমারদের জন্য দ্রুত কম্পিউটারাইজড মেমো প্রিন্ট করা।</li>
              <li><strong>কাস্টমার ও মহাজনের খতিয়ান:</strong> কার কাছে কত টাকা বাকি পাওনা আছে আর মহাজন কত পাবে তা এক ক্লিকে দেখা।</li>
              <li><strong>বারকোড দিয়ে দ্রুত বিক্রি:</strong> কাউন্টারে বারকোড স্ক্যানার দিয়ে চোখের পলকে বিল তৈরি করা।</li>
              <li><strong>স্টক এজিং (পুরনো মালের মেয়াদ):</strong> কত দিনের অবিক্রিত মাল গুদামে পড়ে টাকা আটকে আছে তা নিখুঁতভাবে চিহ্নিত করা।</li>
            </ul>

            <h4 className="font-bold text-base text-[#800000] dark:text-rose-400 flex items-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              সুপার এডমিন (Super Admin) হিসেবে আপনার বিশেষ ক্ষমতা:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs shadow-xs">
                <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 block mb-1">১. গোপনীয় হিসাব অডিট</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">ব্যবসায়িক ব্যালেন্স শিট, মোট মূলধন এবং প্রতিটি ইনভয়েসে কত টাকা নিট লাভ হলো তা শুধু আপনি দেখতে পারবেন।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs shadow-xs">
                <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 block mb-1">২. ভুল চালান বাতিল</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">কর্মচারীরা কোনো ভুল চালান কাটলে তা বাতিল (Cancel) করার ক্ষমতা আপনার, যা বাতিল করলে স্টক ও টাকার হিসাব আগের মতো হয়ে যায়।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs shadow-xs">
                <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 block mb-1">৩. কর্মচারী নিয়ন্ত্রণ</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">নতুন কর্মচারী বা ক্যাশিয়ারের জন্য আইডি তৈরি করে দেওয়া, পাসওয়ার্ড রিসেট করা বা চাকরি ছাড়লে আইডি বন্ধ করার একমাত্র ক্ষমতা আপনার।</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'sec-login',
        number: '০২',
        title: 'লগইন ও প্রাথমিক স্ক্রিন পরিচিতি',
        icon: KeyRound,
        category: 'প্রাথমিক ধারণা',
        keywords: ['লগইন', 'পাসওয়ার্ড', 'থিম', 'লাইট মোড', 'ডার্ক মোড', 'লগআউট', 'হেডার'],
        summary: 'কীভাবে সফটওয়্যারে প্রবেশ করবেন, থিম পরিবর্তন করবেন এবং নিরাপদ লগআউট করবেন।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              লগইন করার সহজ ৩টি ধাপ:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-xs font-bold mr-1">১</span>
                <strong className="text-xs">ইমেইল লিখুন:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">লগইন স্ক্রিনের Email বক্সে আপনার এডমিন ইমেইল দিন (যেমন: admin@inventory.local)।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-xs font-bold mr-1">২</span>
                <strong className="text-xs">পাসওয়ার্ড দিন:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">আপনার গোপন পাসওয়ার্ডটি লিখুন (টাইপ করার সময় ডট চিহ্ন উঠবে)।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-xs font-bold mr-1">৩</span>
                <strong className="text-xs">Login চাপুন:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">সবুজ 'Sign In' বা Login বাটনে ক্লিক করলেই সাথে সাথে প্রধান ড্যাশবোর্ড খুলে যাবে।</p>
              </div>
            </div>

            <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 pt-2">
              স্ক্রিনের উপরের বার (Header)-এর বোতামগুলোর কাজ:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-neutral-300 dark:border-slate-700">
                <thead className="bg-[#eaf1f8] dark:bg-slate-800 font-bold text-neutral-800 dark:text-neutral-200">
                  <tr>
                    <th className="border border-neutral-300 dark:border-slate-700 p-2 w-48">বোতাম বা আইকন</th>
                    <th className="border border-neutral-300 dark:border-slate-700 p-2">কাজের বিবরণ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-200 dark:border-slate-800">
                    <td className="border border-neutral-300 dark:border-slate-700 p-2 font-mono font-bold">☰ (Menu Toggle)</td>
                    <td className="border border-neutral-300 dark:border-slate-700 p-2">বাম পাশের বড় মেন্যু বারটি আড়াল করতে বা আবার দেখাতে এটি চাপুন (কীবোর্ড শর্টকাট: <kbd className="px-1 bg-neutral-200 dark:bg-slate-700 rounded">Ctrl + B</kbd>)।</td>
                  </tr>
                  <tr className="border-b border-neutral-200 dark:border-slate-800">
                    <td className="border border-neutral-300 dark:border-slate-700 p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">Dev WhatsApp</td>
                    <td className="border border-neutral-300 dark:border-slate-700 p-2">সফটওয়্যারে কোনো সমস্যা হলে সরাসরি সফটওয়্যার নির্মাতা মো: ইসরাফিল হোসেনের সাথে হোয়াটসঅ্যাপে কথা বলতে এই বাটনে চাপ দিন।</td>
                  </tr>
                  <tr className="border-b border-neutral-200 dark:border-slate-800">
                    <td className="border border-neutral-300 dark:border-slate-700 p-2 font-mono font-bold">Theme (সূর্য/চাঁদ)</td>
                    <td className="border border-neutral-300 dark:border-slate-700 p-2">দিনের বেলা সাদা স্ক্রিন (Light Mode) এবং রাতে চোখের আরামের জন্য কালো স্ক্রিন (Dark Mode) পরিবর্তন করতে চাপ দিন।</td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 dark:border-slate-700 p-2 font-mono font-bold text-rose-700 dark:text-rose-400">Logout</td>
                    <td className="border border-neutral-300 dark:border-slate-700 p-2">কাজ শেষে সফটওয়্যার থেকে নিরাপদে বের হয়ে আসার জন্য এই লাল বোতামটি ব্যবহার করবেন।</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'sec-dashboard',
        number: '০৩',
        title: 'প্রধান ড্যাশবোর্ড (Executive Dashboard)',
        icon: LayoutDashboard,
        category: 'দৈনন্দিন কার্যক্রম',
        keywords: ['ড্যাশবোর্ড', 'আজকের বিক্রি', 'চলতি মাস', 'স্টক ভ্যালুয়েশন', 'লো স্টক', 'শর্টকাট'],
        summary: 'ব্যবসার সার্বিক আয়, মোট বিক্রি, মজুদ মালের সম্পদ এবং সতর্কতা এক নজরে পরখ করুন।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>
              লগইন করার পরপরই এই স্ক্রিনটি দেখা যায়। এখানে ব্যবসার সার্বিক আয়, মোট বিক্রি, মোট মালের দাম এবং ফুরিয়ে যাওয়া মালের ওয়ার্নিং এক নজরে ভেসে ওঠে।
            </p>

            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              ৬টি প্রধান তথ্য কার্ড (KPI Tiles):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border-2 border-emerald-600 dark:border-emerald-500 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 block">১. Today's Sales Value</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">আজ সকাল থেকে এখন পর্যন্ত মোট কত টাকার বিক্রি হয়েছে এবং কয়টি ক্যাশ মেমো কাটা হয়েছে।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300 block">২. Month Sales Total</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">চলতি মাসের ১ তারিখ থেকে আজ পর্যন্ত মোট কত টাকার বিক্রি হয়েছে (বর্তমান মাসের রেভিনিউ)।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-purple-400 dark:border-purple-600 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-purple-800 dark:text-purple-300 block">৩. Total Stock Quantity</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">আপনার সব গুদাম মিলিয়ে বর্তমানে সর্বমোট কত পিস মাল অবশিষ্ট আছে।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-neutral-800 dark:text-neutral-300 block">৪. Active Products</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">আপনার ক্যাটালগে মোট কত আইটেমের পণ্য এন্ট্রি করা আছে।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-teal-400 dark:border-teal-600 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300 block">৫. Est. Cost Valuation</span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">গুদামে যে মালগুলো আছে তার কেনা দাম মোট কত টাকা (আপনার চলতি ব্যবসার মূলধন সম্পদ)।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border-2 border-red-500 rounded-xs shadow-xs">
                <span className="text-xs font-bold uppercase text-red-700 dark:text-red-400 block">৬. Low & Out of Stock</span>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">যেসব মালের স্টক শেষ হয়ে গেছে বা কমে গেছে তার লাল সতর্কতা। সংখ্যাটিতে চাপ দিলে সরাসরি পণ্যগুলো দেখা যাবে।</p>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-xs text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>কীবোর্ড শর্টকাট:</strong> ড্যাশবোর্ডের উপরে থাকা বাটনগুলো কীবোর্ডের <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F1</kbd> (Sales), <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F2</kbd> (Purchases), <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F3</kbd> (Products), <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F4</kbd> (Inventory), <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F5</kbd> (Parties), <kbd className="px-1 bg-white dark:bg-slate-800 border rounded">F6</kbd> (Reports) চাপ দিয়ে মাউস ছাড়াই সরাসরি চলে যাওয়া যায়!
            </div>
          </div>
        ),
      },
      {
        id: 'sec-products',
        number: '০৪',
        title: 'পণ্য ব্যবস্থাপনা ও রেট ফিক্সিং (Product Catalog)',
        icon: Package,
        category: 'পণ্য ও স্টক',
        keywords: ['পণ্য', 'প্রোডাক্ট', 'বারকোড', 'প্যাক সাইজ', 'কার্টন', 'ক্রয়মূল্য', 'বিক্রয়মূল্য', 'রিঅর্ডার'],
        summary: 'নতুন পণ্য যোগ করা, বারকোড দেওয়া, কেনা দর ও বিক্রয় দর নির্ধারণ এবং লেবেল প্রিন্ট।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              নতুন পণ্য যুক্ত করার ধাপে ধাপে নিয়ম (+ Add Product):
            </h4>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>Product Catalog মেন্যুতে গিয়ে উপরের সবুজ বা সাদা <strong>`+ Add Product`</strong> বাটনে চাপ দিন।</li>
              <li><strong>Product Name (পণ্যের নাম):</strong> পণ্যের নাম পরিষ্কারভাবে লিখুন (যেমন: Lux Soap 100g বা তেলের বোতল ১ লিটার)।</li>
              <li><strong>Item Code / SKU:</strong> পণ্যের একটি ছোট কোড দিতে পারেন বা অটো থাকতে দিন।</li>
              <li><strong>Barcode (বারকোড):</strong> বারকোড স্ক্যানার দিয়ে পণ্যের গায়ে স্ক্যান করুন অথবা পাশে থাকা ক্যামেরা আইকন দিয়ে মোবাইলের ক্যামেরায় স্ক্যান করুন। কোড স্বয়ংক্রিয়ভাবে বসে যাবে।</li>
              <li><strong>Category & Company:</strong> ড্রপডাউন থেকে পণ্যটির ক্যাটাগরি এবং কোন কোম্পানির তা নির্বাচন করুন।</li>
              <li><strong>Pack Size (এক কার্টনে কয় পিস):</strong> যদি এক কার্টনে ২৪ পিস থাকে তবে `24` লিখুন। সফটওয়্যার নিজে থেকেই কার্টনের সাথে পিস মিলিয়ে নিবে!</li>
              <li><strong>Cost Price (কেনা দর):</strong> প্রতি পিস কত টাকায় কেনা পড়েছে তা লিখুন।</li>
              <li><strong>Selling Price (বিক্রয় দর):</strong> প্রতি পিস কাস্টমারের কাছে কত টাকায় বেচবেন তা লিখুন।</li>
              <li><strong>Reorder Level (সতর্কবার্তা লেভেল):</strong> গুদামে কয় পিস মাল অবশিষ্ট নামলে সফটওয়্যার ওয়ার্নিং দিবে (যেমন: ১০ পিস লিখলে ১০ এ নামার সাথে সাথে ওয়ার্নিং আসবে)।</li>
              <li><strong>Save বাটন চাপুন:</strong> সাথে সাথে পণ্যটি সেভ হয়ে যাবে।</li>
            </ol>

            <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 pt-2">
              টেবিলের প্রতিটি লাইনের বোতামগুলোর কাজ:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong>👁️ চোখের আইকন (View Details):</strong> পণ্যের সমস্ত তথ্য ও সব গুদামের আলাদা আলাদা মজুদ দেখার জন্য।
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong>✏️ কলমের আইকন (Edit Product):</strong> পণ্যের নাম, দাম, বা তথ্য সংশোধন করার জন্য।
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong>🖨️ প্রিন্টার আইকন (Barcode Print):</strong> পণ্যের গায়ে লাগানোর জন্য স্টিকার বা বারকোড প্রিন্ট করতে।
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'sec-sales',
        number: '০৫',
        title: 'বিক্রয় ও পিওএস ক্যাশ মেমো (Sales & POS Billing)',
        icon: ShoppingCart,
        category: 'দৈনন্দিন কার্যক্রম',
        keywords: ['বিক্রি', 'সেলস', 'পিওএস', 'বারকোড', 'ম্যানুয়াল চালান', 'ক্যাশ মেমো', 'প্রিন্ট', 'কেন্সেল'],
        summary: 'ম্যানুয়াল চালান বা বারকোড স্ক্যানার দিয়ে নিমেষে ক্যাশ ও বাকির বিল তৈরি ও প্রিন্ট।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>সফটওয়্যারে দুই ধরনের বিক্রির ব্যবস্থা রাখা হয়েছে:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Manual Sale */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-2 border-emerald-700 dark:border-emerald-600 rounded-xs space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <h5 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">১. Sale By Manual (ম্যানুয়াল চালান)</h5>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">পাইকারি ও বড় অর্ডারের জন্য উপযুক্ত, যেখানে কাস্টমার বেছে কার্টন, ডিসকাউন্ট ও বাকির হিসাব রাখা হয়।</p>
                <ol className="list-decimal list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li><strong>Sale By Manual</strong> বাটনে চাপ দিন।</li>
                  <li><strong>Payment Mode:</strong> CASH (নগদ) অথবা CREDIT (বাকি) সিলেক্ট করুন।</li>
                  <li><strong>Customer:</strong> কাস্টমারের নাম বেছে নিন (বা + বাটনে নতুন কাস্টমার যোগ করুন)।</li>
                  <li><strong>Carton ও Loose:</strong> কয় কার্টন আর খুচরা কয় পিস তা লিখুন।</li>
                  <li><strong>Paid Amount:</strong> কাস্টমার কত টাকা নগদ জমা দিলেন তা লিখুন।</li>
                  <li><strong>Current Dues:</strong> বাকি কত টাকা রইলো তা সফটওয়্যার নিজে হিসাব করে নিবে।</li>
                  <li><strong>Save চাপুন:</strong> চালানের নম্বরসহ মেমো তৈরি হয়ে যাবে।</li>
                </ol>
              </div>

              {/* POS Sale */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-2 border-[#800000] dark:border-rose-700 rounded-xs space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-rose-700" />
                  <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300">২. Sale By POS (সুপারফাস্ট বারকোড বিলিং)</h5>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">খুচরা কাউন্টারের জন্য, যেখানে চোখের পলকে স্ক্যান করে ক্যাশ মেমো প্রিন্ট করা হয়।</p>
                <ol className="list-decimal list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li>লাল রঙের <strong>Sale By POS</strong> বাটনে চাপ দিন।</li>
                  <li>বারকোড রিডার দিয়ে পণ্যের গায়ে স্ক্যান করুন। প্রতি স্ক্যানে ১ পিস করে যোগ হবে।</li>
                  <li>কীবোর্ডের + বা - দিয়ে পরিমাণ বাড়াতে বা কমাতে পারেন।</li>
                  <li>কাস্টমারের দেওয়া টাকা লিখে <strong>Print & Complete</strong> চাপুন।</li>
                  <li>মুহূর্তের মধ্যে মেমো প্রিন্ট হয়ে যাবে।</li>
                </ol>
              </div>
            </div>

            <div className="p-3 bg-red-50 dark:bg-rose-950/40 border border-red-300 dark:border-rose-900 rounded-xs text-xs text-red-900 dark:text-red-200">
              ⚠️ <strong>ভুল চালান বাতিল (Cancel Sale):</strong> কোনো কর্মচারী যদি ভুল চালান কাটে, তবে সুপার এডমিন হিসেবে আপনি লাল <strong>Cancel</strong> বাটনে চাপ দিয়ে চালানটি বাতিল করতে পারেন। সাথে সাথে মালের স্টক গুদামে ফিরে আসবে এবং কাস্টমারের বাকি মুছে যাবে!
            </div>
          </div>
        ),
      },
      {
        id: 'sec-purchases',
        number: '০৬',
        title: 'মাল ক্রয় ও সাপ্লায়ার চালান (Purchases)',
        icon: Truck,
        category: 'দৈনন্দিন কার্যক্রম',
        keywords: ['ক্রয়', 'পারচেজ', 'সাপ্লায়ার', 'মহাজন', 'স্টক ইন', 'গুদামে মাল ঢোকা'],
        summary: 'মহাজন বা কোম্পানির কাছ থেকে মাল ক্রয়ের চালান এন্ট্রি ও গুদামের স্টক বৃদ্ধি।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>মহাজন বা কোম্পানির গাড়ি থেকে মাল নামার সাথে সাথে এই সেকশনে এন্ট্রি করতে হবে। এতে গুদামের স্টক স্বয়ংক্রিয়ভাবে বেড়ে যায়।</p>

            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              মাল কেনার চালান এন্ট্রি করার নিয়ম (+ New Purchase Invoice):
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-2">
              <li>Purchases মেন্যুতে গিয়ে <strong>`+ New Purchase Invoice`</strong> বাটনে চাপ দিন।</li>
              <li><strong>Supplier:</strong> যে কোম্পানির বা মহাজনের কাছ থেকে মাল এসেছে তার নাম বেছে নিন।</li>
              <li><strong>Payment Mode:</strong> নগদ মাল কিনলে `CASH` আর বাকিতে কিনলে `SUPPLIER (Credit)` সিলেক্ট করুন।</li>
              <li><strong>পণ্য সিলেক্ট করুন:</strong> কয় কার্টন বা কয় পিস এসেছে এবং প্রতি পিস কেনা দর কত পড়েছে তা লিখুন।</li>
              <li><strong>Paid Amount:</strong> মহাজনকে এই চালানের বিপরীতে নগদ কত টাকা পরিশোধ করলেন তা লিখুন। বাকি টাকা মহাজনের বকেয়া খাতায় যুক্ত হবে।</li>
              <li><strong>Save চাপুন:</strong> সাথে সাথে গুদামে মালের সংখ্যা বেড়ে যাবে।</li>
            </ol>
          </div>
        ),
      },
      {
        id: 'sec-warehouses',
        number: '০৭',
        title: 'ওয়্যারহাউস ও গুদাম ব্যবস্থাপনা (Warehouses & Stock)',
        icon: Warehouse,
        category: 'পণ্য ও স্টক',
        keywords: ['ওয়্যারহাউস', 'গুদাম', 'গোডাউন', 'মাল্টি গুদাম', 'ডিফল্ট গুদাম'],
        summary: 'একাধিক দোকান বা গোডাউন তৈরি করা এবং কোন গুদামে কত মাল আছে তা পর্যবেক্ষণ।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>আপনার প্রতিষ্ঠানে যদি একাধিক দোকান বা গোডাউন থাকে (যেমন: মেইন শোরুম, গোডাউন-১, গোডাউন-২), তবে এটি ব্যবহার করবেন।</p>

            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>+ Add Warehouse:</strong> নতুন গুদামের নাম, ঠিকানা ও কোড লিখে গুদাম তৈরি করুন।</li>
              <li><strong>Default Warehouse:</strong> যে গুদামে সাধারণ বিক্রি বেশি হয়, সেটিকে Default বানিয়ে রাখুন।</li>
              <li>প্রতিটি গুদামের পাশে কত পিস ও কত টাকার মাল আছে তা আলাদাভাবে দেখা যায়।</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-adjustments',
        number: '০৮',
        title: 'স্টক সমন্বয় ও কারেকশন (Stock Adjustments & Transfer)',
        icon: Boxes,
        category: 'পণ্য ও স্টক',
        keywords: ['এডজাস্টমেন্ট', 'ভাঙা মাল', 'নষ্ট মাল', 'ট্রান্সফার', 'কারেকশন', 'ড্যামেজ'],
        summary: 'মাল ভেঙে নষ্ট হলে, হারিয়ে গেলে বা গুদামের মধ্যে মাল স্থানান্তরের সঠিক নিয়ম।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs space-y-2">
                <h5 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ১. স্টক এডজাস্টমেন্ট (Stock Adjustment)
                </h5>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">বাস্তব মালের সাথে কম্পিউটারের মালের গরমিল হলে স্টক বাড়াতে বা কমাতে এটি ব্যবহার করবেন।</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li><strong>DAMAGE:</strong> মাল ভেঙে বা নষ্ট হয়ে গেলে স্টক কমাতে।</li>
                  <li><strong>LOSS:</strong> মাল হারিয়ে বা চুরি হয়ে গেলে কমাতে।</li>
                  <li><strong>CORRECTION:</strong> পূর্বের কোনো হিসাবের ভুল সংশোধন করতে।</li>
                  <li><strong>RESTOCK:</strong> চালানের বাইরে নতুন মাল বাড়াতে।</li>
                </ul>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs space-y-2">
                <h5 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  ২. স্টক ট্রান্সফার (Stock Transfer)
                </h5>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">এক গুদাম থেকে অন্য গুদামে মাল পাঠাতে এটি ব্যবহার করবেন।</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li><strong>Source Warehouse:</strong> যে গুদাম থেকে মাল বের হচ্ছে।</li>
                  <li><strong>Destination Warehouse:</strong> যে গুদামে মাল পৌঁছাচ্ছে।</li>
                  <li>কনফার্ম করলেই প্রথম গুদাম থেকে মাল কমে দ্বিতীয় গুদামে যোগ হয়ে যাবে।</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'sec-parties',
        number: '০৯',
        title: 'কাস্টমার ও সাপ্লায়ার হিসাব (Parties & Due Management)',
        icon: Users,
        category: 'হিসাব ও দেনা-পাওনা',
        keywords: ['কাস্টমার', 'সাপ্লায়ার', 'বাকি', 'লেজার', 'খতিয়ান', 'এসআর গ্রুপ', 'ওপেনিং ডিউ'],
        summary: 'কাস্টমার ও মহাজনদের আগের বাকি সেট করা এবং তাদের সম্পূর্ণ খতিয়ান (Ledger) দেখা।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>মেন্যু থেকে <strong>Parties</strong>-এ গেলে দুটি ট্যাব দেখতে পাবেন: <strong>Suppliers</strong> (মহাজন) এবং <strong>Customers</strong> (কাস্টমার)।</p>

            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              নতুন কাস্টমার যোগ ও আগের বাকি তোলা:
            </h4>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Name & Phone:</strong> কাস্টমার বা তার দোকানের নাম ও মোবাইল নম্বর লিখুন।</li>
              <li><strong>SR Group:</strong> কোন সেলস রিপ্রেজেন্টেটিভ (SR) এই কাস্টমারকে দেখাশোনা করে তা বেছে নিন।</li>
              <li><strong>Opening Due (পূর্বের বাকি):</strong> এই সফটওয়্যার ব্যবহারের আগে যদি তার কাছে পুরোনো কোনো বাকি থেকে থাকে, তবে সেই টাকার অংক এখানে লিখে দিন। সফটওয়্যার নিজে থেকেই তার খতিয়ানে এই টাকা যোগ করে নিবে!</li>
            </ul>

            <h4 className="font-bold text-base text-blue-800 dark:text-blue-300 pt-1">
              কাস্টমার লেজার বা খতিয়ান (Customer Ledger):
            </h4>
            <p className="text-xs">
              কাস্টমারের নামের পাশে থাকা <strong>Ledger</strong> বাটনে চাপ দিলে তার জীবনের সব হিসাবের বিবরণ বের হবে: কোন তারিখে কত টাকার মাল নিল, কত টাকা জমা দিল আর বর্তমান নিট বাকি কত টাকা। এটি সরাসরি প্রিন্ট করে কাস্টমারকে তাগাদা দিতে পারবেন।
            </p>
          </div>
        ),
      },
      {
        id: 'sec-payments',
        number: '১০',
        title: 'টাকা আদায় ও পরিশোধ ভাউচার (Payments & Vouchers)',
        icon: BadgeDollarSign,
        category: 'হিসাব ও দেনা-পাওনা',
        keywords: ['পেমেন্ট', 'টাকা আদায়', 'কালেকশন', 'মহাজন পরিশোধ', 'ভাউচার', 'বিকাশ', 'চেক'],
        summary: 'কাস্টমার বাকি টাকা দিতে আসলে মানি রিসিট কাটা এবং মহাজনের বাকি শোধ করা।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-600 rounded-xs space-y-1.5">
                <strong className="text-emerald-800 dark:text-emerald-300 text-sm block">১. কাস্টমার থেকে বকেয়া আদায় (+ Customer Collection)</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">কাস্টমার সিলেক্ট করুন। কত টাকা দিচ্ছে তা লিখুন। নগদ, ব্যাংক, বিকাশ, নগদ নাকি চেকে দিচ্ছে তা সিলেক্ট করে সেভ করুন। কাস্টমারের বাকি সাথে সাথে কমে যাবে এবং মানি রিসিট তৈরি হবে।</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-rose-600 rounded-xs space-y-1.5">
                <strong className="text-rose-800 dark:text-rose-300 text-sm block">২. মহাজনকে টাকা পরিশোধ (+ Supplier Payment)</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">সাপ্লায়ার সিলেক্ট করে যত টাকা তাকে পরিশোধ করছেন তা লিখে সেভ করুন। আপনার দেনা কমে যাবে।</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'sec-returns',
        number: '১১',
        title: 'মাল ফেরত বা রিটার্ন ব্যবস্থাপনা (Returns & Refunds)',
        icon: RotateCcw,
        category: 'দৈনন্দিন কার্যক্রম',
        keywords: ['রিটার্ন', 'মাল ফেরত', 'সেলস রিটার্ন', 'পারচেজ রিটার্ন', 'টাকা ফেরত', 'এডজাস্টমেন্ট'],
        summary: 'কাস্টমার মাল ফেরত দিলে ক্যাশ ফেরত দেওয়া বা বকেয়া থেকে টাকা কাটার উপায়।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              কাস্টমার মাল ফেরত দিলে (+ New Sales Return):
            </h4>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>কাস্টমার ও তার চালানের নম্বর সিলেক্ট করুন।</li>
              <li>কোন পণ্যটি কয় পিস ফেরত এসেছে তা লিখুন।</li>
              <li><strong>Refund Type:</strong> `CASH` দিলে আপনি তাকে নগদ টাকা ফেরত দিবেন, আর `CREDIT_ADJUSTMENT` দিলে তার আগের বাকি থেকে এই টাকা বাদ যাবে।</li>
              <li>সেভ করলেই ফেরত আসা মাল স্বয়ংক্রিয়ভাবে আবার গুদামে স্টকে যোগ হয়ে যাবে।</li>
            </ol>
          </div>
        ),
      },
      {
        id: 'sec-expenses',
        number: '১২',
        title: 'দৈনিক দোকান পরিচালন খরচ (Daily Expenses)',
        icon: Receipt,
        category: 'হিসাব ও দেনা-পাওনা',
        keywords: ['খরচ', 'দোকান ভাড়া', 'বিদ্যুৎ বিল', 'বেতন', 'চা নাস্তা', 'এক্সপেন্স'],
        summary: 'দোকান ভাড়া, কর্মচারীর বেতন ও নাস্তা বিল এন্ট্রি রাখা যাতে সঠিক নিট লাভ জানা যায়।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>দোকানের প্রতিদিনের ছোট-বড় সব খরচ এন্ট্রি দিতে <strong>Expenses</strong> মেন্যুতে যান।</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>+ Add Expense:</strong> খরচের খাত সিলেক্ট করুন (দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন, চা-নাস্তা বা গাড়ি ভাড়া)।</li>
              <li>টাকার অংক লিখে সেভ করুন।</li>
              <li>দিনশেষে সফটওয়্যার আপনার মোট বিক্রির লাভ থেকে এই খরচ বাদ দিয়ে আসল নিট লাভ দেখাবে!</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-reports',
        number: '১৩',
        title: 'এডভান্সড রিপোর্ট ও অ্যানালিটিক্স (Advanced Reports & Stock Aging)',
        icon: BarChart3,
        category: 'রিপোর্ট ও বিশ্লেষণ',
        keywords: ['রিপোর্ট', 'স্টক এজিং', 'ফাস্ট মুভিং', 'ব্যালেন্স শিট', 'ইনভয়েস লাভ', 'এসআর সেলস'],
        summary: 'স্টক এজিং, ডেড স্টক, ব্যালেন্স শিট এবং প্রতিটি চালানে লাভ দেখার পূর্ণাঙ্গ গাইড।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>ব্যবসার গুরুত্বপূর্ণ সিদ্ধান্ত নেওয়ার জন্য <strong>Reports & Ledger</strong> হলো প্রধান জায়গা।</p>

            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              ১. স্টক এলার্ট ও এজিং (Stock Alerts & Aging):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-red-700 dark:text-red-400 block mb-1">Low Stock Alerts</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">যেসব মাল ফুরিয়ে যাচ্ছে। এখানে সফটওয়্যার নিজে হিসাব করে বলে দেয় নতুন করে কয় কার্টন অর্ডার দিতে হবে (Suggested Qty)।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-blue-700 dark:text-blue-400 block mb-1">Stock Aging Report</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">অবিক্রিত মালের বয়স: ০-৩০ দিন, ৩১-৬০ দিন, ৬১-৯০ দিন বা ৯০+ দিনের ডেড স্টক চিহ্নিত করা যাতে মাল পচে যাওয়ার আগেই বিক্রি করা যায়।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-purple-700 dark:text-purple-400 block mb-1">Product Velocity</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">কোন পণ্য দ্রুত বিক্রি হয় (Fast), কোনটা মাঝারি (Moderate) আর কোনটা একদমই চলে না (Dead Stock) তা আলাদা করে দেখা।</p>
              </div>
            </div>

            <h4 className="font-bold text-base text-[#800000] dark:text-rose-400 pt-2">
              ২. এডমিনদের জন্য বিশেষ রিপোর্ট (Admin Only):
            </h4>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
              <li><strong>Balance Sheet (ব্যবসায়িক স্থিতিপত্র):</strong> মোট মালের দাম + কাস্টমারদের কাছে মোট পাওনা - মহাজনের দেনা = আপনার প্রতিষ্ঠানের আসল নিট মূলধন কত টাকা তা দেখা।</li>
              <li><strong>Profit by Invoice (চালান ভিত্তিক লাভ):</strong> প্রতিটি মেমোতে কয় টাকা মাল কেনা ছিল আর কয় টাকায় বিক্রি হয়েছে, অর্থাৎ কোন চালানে কয় টাকা লাভ হয়েছে তা গোপনে দেখা।</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-users',
        number: '১৪',
        title: 'কর্মচারী ও ইউজার একাউন্ট নিয়ন্ত্রণ (User Management)',
        icon: Users,
        category: 'এডমিন ও নিরাপত্তা',
        keywords: ['ইউজার', 'কর্মচারী', 'ম্যানেজার', 'পাসওয়ার্ড রিসেট', 'অনুমোদন', 'ডিএক্টিভ'],
        summary: 'কর্মচারীদের জন্য আইডি তৈরি, পাসওয়ার্ড ভুলে গেলে রিসেট করা এবং পদবী নিয়ন্ত্রণ।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>দোকানে কাজ করা কর্মচারীদের জন্য আলাদা ইউজার আইডি তৈরি করতে <strong>Users</strong> মেন্যুতে যান।</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>+ Add User:</strong> কর্মচারীর নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে আইডি তৈরি করুন।</li>
              <li><strong>Role (পদবী):</strong> কর্মচারীদের `MANAGER` পদবী দিন যাতে তারা শুধু মেমো কাটতে পারে কিন্তু আপনার লাভ-ক্ষতি বা ব্যালেন্স শিট দেখতে না পারে।</li>
              <li><strong>পাসওয়ার্ড রিসেট:</strong> কোনো কর্মচারী পাসওয়ার্ড ভুলে গেলে তার নামের পাশে থাকা চাবি আইকনে (Key Icon) ক্লিক করে নতুন পাসওয়ার্ড সেট করে দিতে পারেন।</li>
              <li><strong>কর্মচারী চাকরি ছাড়লে:</strong> তাকে ডিলিট না করে Inactive করে দিন, যাতে সে আর সফটওয়্যারে ঢুকতে না পারে কিন্তু আগের সব চালানের প্রমাণ টিকে থাকে।</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-audit',
        number: '১৫',
        title: 'নিরাপত্তা ও কাজের ডিজিটাল প্রমাণ (Audit Trail)',
        icon: ShieldCheck,
        category: 'এডমিন ও নিরাপত্তা',
        keywords: ['অডিট', 'প্রমাণ', 'লগ', 'কারচুপি', 'নিরাপত্তা', 'ইতিহাস'],
        summary: 'কে কখন কোন চালান কাটলো বা তথ্য পরিবর্তন করলো তার ডিজিটাল প্রমাণ দেখা।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>সফটওয়্যারে কোনো কর্মচারী কারচুপি করতে পারবে না। <strong>Audit Trail</strong> মেন্যুতে প্রতিটি কাজের ডিজিটাল লগ সংরক্ষিত থাকে:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
              <li>কোন কর্মচারী ঠিক কয়টার সময় কোন চালান কাটলো।</li>
              <li>কে পণ্যের বিক্রয় দর বা দাম পরিবর্তন করলো।</li>
              <li>কে কাস্টমারের টাকা জমা দেখালো বা কার আইডি চালু করা হলো।</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-settings',
        number: '১৬',
        title: 'দোকানের নাম ও মেমো সেটিং (Store Settings)',
        icon: Building2,
        category: 'এডমিন ও নিরাপত্তা',
        keywords: ['সেটিংস', 'দোকানের নাম', 'প্রোপ্রাইটর', 'ঠিকানা', 'মেমো ফুটার', 'ধন্যবাদ বার্তা'],
        summary: 'ক্যাশ মেমোতে আপনার প্রতিষ্ঠানের নাম, ঠিকানা ও শুভেচ্ছা বার্তা সেট করা।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <p>আপনার ক্যাশ মেমোর ওপরে এবং নিচে আপনার দোকানের নাম ও ঠিকানা সুন্দরভাবে আসার জন্য <strong>Settings</strong> মেন্যুতে যান।</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Store Name:</strong> আপনার দোকানের পুরো নাম লিখুন (যেমন: এম.আর. এন্টারপ্রাইজ)।</li>
              <li><strong>Proprietor:</strong> প্রোপ্রাইটরের নাম দিন।</li>
              <li><strong>Phone & Address:</strong> মোবাইল নম্বর ও দোকানের ঠিকানা লিখুন।</li>
              <li><strong>Memo Footer Note:</strong> মেমোর নিচের শুভেচ্ছা বার্তা লিখুন (যেমন: "আমাদের সাথে থাকার জন্য ধন্যবাদ! বিক্রিত মাল ফেরত নেওয়া হয়।")।</li>
              <li>সেভ করলে পরবর্তী সব মেমোতে এই তথ্য স্বয়ংক্রিয়ভাবে প্রিন্ট হবে।</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sec-faq',
        number: '১৭',
        title: 'দৈনন্দিন কাজের সঠিক নিয়ম ও সাধারণ প্রশ্নের সমাধান (Daily Workflow & FAQ)',
        icon: HelpCircle,
        category: 'প্রশ্ন ও উত্তর',
        keywords: ['দৈনিক নিয়ম', 'সকালের কাজ', 'রাতের কাজ', 'প্রশ্ন', 'ভুল হলে কি করব', 'সমস্যা'],
        summary: 'সকালে দোকান খুলে কী দেখতে হবে, রাতে কী মেলাতে হবে এবং সাধারণ ভুলগুলোর সমাধান।',
        content: (
          <div className="space-y-4 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            <h4 className="font-bold text-base text-[#004d00] dark:text-emerald-400">
              দৈনন্দিন কাজের সেরা রুটিন:
            </h4>
            <div className="space-y-2">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-emerald-800 dark:text-emerald-300 block">১. প্রতিদিন সকালে দোকান খোলার পর:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">ড্যাশবোর্ডে <strong>Low Stock Alert</strong> দেখুন—কোন কোন মাল শেষ হয়ে গেছে তা মহাজনকে অর্ডার দিন। এরপর <strong>Due List</strong> দেখে আজ কাদের কাছ থেকে টাকা তুলতে হবে তাদের তালিকা করুন।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-blue-800 dark:text-blue-300 block">২. সারাদিন বেচাকেনার সময়:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">প্রতিটি বিক্রির সাথে সাথে সফটওয়্যারে ক্যাশ মেমো কাটুন (হাতে লেখা বন্ধ রাখুন)। মহাজনের মাল নামার সাথে সাথে Purchases এন্ট্রি দিন।</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                <strong className="text-xs text-purple-800 dark:text-purple-300 block">৩. রাতে দোকান বন্ধ করার সময়:</strong>
                <p className="text-xs text-neutral-600 dark:text-neutral-400"><strong>Daily Sales Report</strong> খুলুন। আজকের মোট নগদ জমার সাথে ক্যাশ বাক্সের নগদ টাকা মিলিয়ে নিন। সব ঠিক থাকলে Logout করুন।</p>
              </div>
            </div>

            <h4 className="font-bold text-base text-[#800000] dark:text-rose-400 pt-2">
              সচরাচর প্রশ্ন ও সমাধান (FAQ):
            </h4>
            <div className="space-y-2 text-xs">
              <details className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs cursor-pointer">
                <summary className="font-bold text-neutral-900 dark:text-neutral-100">প্রশ্ন: আমি ভুল করে একটি চালানে ভুল মাল বা ভুল টাকা লিখে ফেলেছি, এখন কী করব?</summary>
                <p className="mt-1.5 text-neutral-600 dark:text-neutral-400 pl-2">উত্তর: কোনো চিন্তা নেই! Sales মেন্যুতে যান। সেই চালানটি খুঁজে বের করে পাশে থাকা লাল রঙের <strong>Cancel</strong> বাটনে চাপ দিন। সাথে সাথে চালানটি বাতিল হয়ে মাল আবার গুদামে ফিরে আসবে এবং কাস্টমারের বাকি মুছে যাবে। এরপর নতুন সঠিক চালানটি কেটে নিন।</p>
              </details>
              <details className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs cursor-pointer">
                <summary className="font-bold text-neutral-900 dark:text-neutral-100">প্রশ্ন: কাস্টমারের নাম তালিকায় খুঁজে পাচ্ছি না কেন?</summary>
                <p className="mt-1.5 text-neutral-600 dark:text-neutral-400 pl-2">উত্তর: কাস্টমারটি হয়তো দোকানে নতুন। চালান কাটার সময় কাস্টমার ঘরের পাশে থাকা <strong>+ Add Customer</strong> বাটনে চাপ দিয়ে নাম ও ফোন নম্বর লিখে সাথে সাথে যুক্ত করে নিন।</p>
              </details>
              <details className="p-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs cursor-pointer">
                <summary className="font-bold text-neutral-900 dark:text-neutral-100">প্রশ্ন: কম্পিউটার হঠাৎ নষ্ট হয়ে গেলে আমার দোকানের ডাটা কি মুছে যাবে?</summary>
                <p className="mt-1.5 text-neutral-600 dark:text-neutral-400 pl-2">উত্তর: না, কখনোই না! আপনার সমস্ত ডাটা আন্তর্জাতিক ক্লাউড সার্ভারে (Neon PostgreSQL) সুরক্ষিত থাকে। কম্পিউটার নষ্ট হলেও যেকোনো নতুন কম্পিউটার বা মোবাইল দিয়ে লগইন করলেই আপনার সব হিসাব অক্ষত অবস্থায় পেয়ে যাবেন।</p>
              </details>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase().trim();
    return sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [sections, searchQuery]);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-[#eef4f9] dark:bg-slate-950">
      
      {/* 1. Header Banner Bar */}
      <div className="bg-[#004d00] dark:bg-emerald-950 text-white px-4 py-2.5 border-b border-[#003800] dark:border-emerald-900 flex flex-wrap items-center justify-between gap-3 shadow-md select-none shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wide">
                এম.আর. এন্টারপ্রাইজ — সফটওয়্যার ব্যবহার সহায়িকা (User Manual)
              </h1>
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded-xs font-mono font-bold border border-emerald-700">
                সহজ বাংলা গাইড
              </span>
            </div>
            <p className="text-[11.5px] text-emerald-100/85">
              নন-টেকনিক্যাল সুপার এডমিন ও অপারেটরদের জন্য প্রতিটি স্ক্রিন ও বাটনের বিস্তারিত নিয়মাবলী
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="গাইডে কোনো কিছু খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 pl-7 pr-2 py-1 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-neutral-900 placeholder:text-emerald-200/70 border border-emerald-600/60 rounded-xs text-xs focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-2 top-2" />
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-7 px-2.5 bg-white text-[#006400] hover:bg-emerald-50 font-bold text-xs rounded-xs flex items-center gap-1.5 shadow-xs transition-colors border border-emerald-800 cursor-pointer"
            title="গাইডটি প্রিন্ট করুন বা PDF হিসেবে সেভ করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Main Layout Container: Left Table of Contents + Right Content Pane */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: Table of Contents (Desktop) */}
        <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-neutral-300 dark:border-slate-800 flex flex-col shrink-0 select-none overflow-hidden">
          <div className="p-2.5 bg-[#eaf1f8] dark:bg-slate-800/80 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
              সূচিপত্র ({filteredSections.length}টি অধ্যায়)
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-red-600 hover:underline cursor-pointer"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar text-xs">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-xs transition-all flex items-start gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#004d00] text-white font-bold shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] px-1 py-0.2 rounded-xs shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-emerald-900 text-emerald-200'
                        : 'bg-neutral-200 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {sec.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="truncate block">{sec.title}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Help Footer Box */}
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-900 dark:text-emerald-300">
            <p className="font-bold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              সাহায্য প্রয়োজন?
            </p>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              ডেভেলপার ইসরাফিল হোসেন (01521410415) এর সাথে সরাসরি কথা বলুন।
            </p>
          </div>
        </aside>

        {/* Right Pane: Scrollable Documentation Content */}
        <main
          ref={contentContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar"
        >
          {filteredSections.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-800 rounded-xs">
              <Search className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="font-bold text-neutral-700 dark:text-neutral-300">কোনো তথ্য পাওয়া যায়নি</p>
              <p className="text-xs text-neutral-500 mt-1">"{searchQuery}" লিখে কিছু মেলেনি। বানান চেক করুন বা ফিল্টার ক্লিয়ার করুন।</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 bg-[#004d00] text-white text-xs font-bold rounded-xs cursor-pointer"
              >
                সম্পূর্ণ গাইড দেখুন
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-800 rounded-xs shadow-xs overflow-hidden transition-all scroll-mt-20"
                >
                  {/* Section Title Bar */}
                  <div className="bg-[#eaf1f8] dark:bg-slate-800/90 border-b border-neutral-300 dark:border-slate-700 px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-[#004d00] text-white font-mono font-bold text-xs rounded-xs">
                        অধ্যায় {sec.number}
                      </span>
                      <Icon className="w-4 h-4 text-[#004d00] dark:text-emerald-400" />
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {sec.title}
                      </h3>
                    </div>
                    <span className="hidden sm:inline text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs">
                      {sec.category}
                    </span>
                  </div>

                  {/* Summary Callout */}
                  <div className="px-4 pt-3 pb-1 text-xs text-neutral-500 dark:text-neutral-400 italic">
                    {sec.summary}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 pt-2">
                    {sec.content}
                  </div>
                </section>
              );
            })
          )}

          {/* Footer Card */}
          <div className="p-4 bg-[#13281b] text-slate-200 border border-[#0d1d14] rounded-xs text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md mt-6">
            <div>
              <p className="font-bold text-sm text-white">এম.আর. এন্টারপ্রাইজ - ProStock ERP সলিউশন</p>
              <p className="text-emerald-200/80 text-[11px] mt-0.5">
                সফটওয়্যার তৈরি ও পরিচালনায়: মো: ইসরাফিল হোসেন (WhatsApp: 01521410415)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট সহায়িকা</span>
              </button>
              <button
                type="button"
                onClick={scrollToTop}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xs cursor-pointer flex items-center gap-1"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>উপরে যান</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 p-2 bg-[#004d00] hover:bg-[#003800] text-white rounded-full shadow-lg border border-emerald-400 transition-all cursor-pointer z-30"
          title="উপরে স্ক্রোল করুন"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
