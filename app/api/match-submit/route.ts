import { NextResponse } from "next/server";
import { safeInsertMatchLead } from "@/lib/supabase";

const PRODUCT_RECOMMENDATIONS: Record<string, { product: string; path: string; config: string }> = {
  glasshouse: {
    product: "Glasshouse",
    path: "/glasshouse",
    config: "Premium glass enclosure, 160-400 sq.ft."
  },
  talishouse_residential: {
    product: "Talishouse Residential",
    path: "/talishouse",
    config: "Full residential home, 800-3,200 sq.ft."
  },
  talistowns: {
    product: "TalisTowns",
    path: "/talistowns",
    config: "Community living, townhome style"
  },
  not_sure: {
    product: "Talishouse Residential",
    path: "/talishouse",
    config: "Based on your goals, we'll recommend the best fit during consultation"
  }
};

function getRecommendation(homeType: string, goal: string, budget?: number): { product: string; path: string; config: string } {
  if (homeType && homeType !== "not_sure" && PRODUCT_RECOMMENDATIONS[homeType]) {
    return PRODUCT_RECOMMENDATIONS[homeType];
  }
  
  if (goal === "invest") {
    return {
      product: "Talishouse Residential",
      path: "/talishouse",
      config: "Investment property, rental-ready configuration"
    };
  }
  
  if (goal === "build") {
    return {
      product: "Talishouse Residential",
      path: "/talishouse",
      config: "Custom build, full residential specs"
    };
  }
  
  return PRODUCT_RECOMMENDATIONS.not_sure;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      goal, 
      budget_min, 
      budget_max, 
      timeline, 
      location, 
      home_type, 
      home_size_sqft, 
      financing_needed, 
      land_owned, 
      name, 
      email, 
      phone 
    } = body;

    if (!name || !email || !phone || !goal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const budget = budget_max || budget_min;
    const recommendation = getRecommendation(home_type || "", goal, budget);

    const payload = {
      goal,
      budget_min: budget_min ? parseFloat(budget_min) : undefined,
      budget_max: budget_max ? parseFloat(budget_max) : undefined,
      timeline,
      location,
      home_type,
      home_size_sqft,
      financing_needed: financing_needed === true || financing_needed === "true",
      land_owned: land_owned === true || land_owned === "true",
      name,
      email,
      phone,
      recommended_product: recommendation.product
    };

    const result = await safeInsertMatchLead(payload);

    return NextResponse.json({
      success: true,
      data: result,
      recommendation: {
        product: recommendation.product,
        path: recommendation.path,
        config: recommendation.config
      }
    });

  } catch (error: any) {
    console.error("Match submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit" },
      { status: 500 }
    );
  }
}
