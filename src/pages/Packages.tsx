import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Package {
  id: string;
  name: string;
  description: string;
  price_amount: number;
  currency: string;
  interval: string;
  features: any;
  is_active: boolean;
  order_index: number;
}

interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  package_id: string | null;
}

export default function Packages() {
  const { t } = useTranslation();
  const { user, session_token } = useCustomAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(5);

  useEffect(() => {
    fetchPackages();
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }

    // Handle success/payment confirmation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true" && user) {
      handlePaymentSuccess();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error(t('packages_page.failed_load'));
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    setCheckingSubscription(true);
    try {
      if (!session_token) {
        throw new Error('No session token found');
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error(t('packages_page.failed_subscription_check'));
    } finally {
      setCheckingSubscription(false);
      setLoading(false);
    }
  };

  const handleSubscribe = async (packageId: string) => {
    if (!user) {
      toast.error(t('packages_page.please_login'));
      return;
    }

    if (!session_token) {
      toast.error(t('packages_page.no_session'));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packageId },
        headers: {
          Authorization: `Bearer ${session_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error(t('packages_page.failed_checkout'));
    }
  };

  const handleCustomSubscribe = async (amount: number) => {
    if (!user) {
      toast.error(t('packages_page.please_login_support'));
      return;
    }

    if (!session_token) {
      toast.error(t('packages_page.no_session'));
      return;
    }

    const numericAmount = Math.max(1, Number(amount));

    if (isNaN(numericAmount) || numericAmount < 1) {
      toast.error(t('packages_page.min_amount_error'));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { customAmount: numericAmount },
        headers: {
          Authorization: `Bearer ${session_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(t('packages_page.failed_custom_checkout'));
      }
    } catch (error: any) {
      console.error("Error creating custom checkout:", error);
      toast.error(
        error?.message
          ? `${t('packages_page.failed_custom_checkout')}: ${error.message}`
          : t('packages_page.failed_custom_checkout')
      );
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    if (!session_token) {
      toast.error(t('packages_page.no_session'));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error(t('packages_page.failed_portal'));
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", user?.id)
        .single();

      let mostExpensivePackage: Package | null = null;
      if (packages.length > 0) {
        mostExpensivePackage = packages.reduce(
          (prev, current) => (prev.price_amount > current.price_amount ? prev : current)
        );
      }

      if (mostExpensivePackage) {
        await supabase.functions.invoke("purchase-webhook", {
          body: {
            customerEmail: user?.email,
            customerName: profile?.username || user?.email,
            packageName: mostExpensivePackage?.name || "Unknown Package",
            price: mostExpensivePackage?.price_amount || 0,
            currency: mostExpensivePackage?.currency || "USD",
          },
        });
      } else {
        await supabase.functions.invoke("purchase-webhook", {
          body: {
            customerEmail: user?.email,
            customerName: profile?.username || user?.email,
            packageName: "Custom Payment",
            price: customAmount ? customAmount * 100 : 0,
            currency: "USD",
          },
        });
      }

      toast.success(t('packages_page.payment_success'));
      window.history.replaceState({}, document.title, window.location.pathname);
      await checkSubscription();
    } catch (error) {
      console.error("Error handling payment success:", error);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    const locale = currency.toLowerCase() === 'dkk' ? 'da-DK' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">{t('packages_page.loading')}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{t('packages_page.choose_package')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('packages_page.description')}
          </p>
        </div>

        {user && subscription && (
          <div className="mb-8 p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{t('packages_page.subscription_status')}</h3>
                <p className="text-muted-foreground">
                  {subscription.subscribed ? (
                    <>
                      {t('packages_page.active')}: {subscription.subscription_tier}
                      {subscription.subscription_end && (
                        <span className="ml-2">
                          ({t('packages_page.expires')} {new Date(subscription.subscription_end).toLocaleDateString()})
                        </span>
                      )}
                    </>
                  ) : (
                    t('packages_page.no_active_subscription')
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={checkSubscription}
                  disabled={checkingSubscription}
                >
                  {checkingSubscription ? t('packages_page.checking') : t('packages_page.refresh_status')}
                </Button>
                {subscription.subscribed && (
                  <Button onClick={handleManageSubscription}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('packages_page.manage_subscription')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const isCurrentPackage = subscription?.package_id === pkg.id;
            return (
              <Card key={pkg.id} className={`relative ${isCurrentPackage ? 'ring-2 ring-primary' : ''}`}>
                {isCurrentPackage && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    {t('packages_page.current_plan')}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-foreground">{pkg.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {pkg.description}
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary">
                    {formatPrice(pkg.price_amount, pkg.currency)}
                    <span className="text-base font-normal text-muted-foreground">
                      /{pkg.interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                    <ul className="space-y-2">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center">{t('packages_page.no_features')}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={!user || isCurrentPackage}
                  >
                    {!user ? (
                      t('packages_page.login_to_subscribe')
                    ) : isCurrentPackage ? (
                      t('packages_page.current_package')
                    ) : subscription?.subscribed ? (
                      t('packages_page.switch_package')
                    ) : (
                      t('packages_page.subscribe_now')
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {/* Custom Amount Card */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">{t('packages_page.custom_support')}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('packages_page.custom_support_description')}
              </CardDescription>
              <div className="text-4xl font-bold text-primary">
                ${customAmount}
                <span className="text-base font-normal text-muted-foreground">
                  /{t('packages_page.one_time')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="number"
                min={1}
                className="w-full border rounded-md px-3 py-2 text-foreground bg-background"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground text-center">
                {t('packages_page.thank_you')}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleCustomSubscribe(customAmount)}
                disabled={!user || customAmount < 1}
              >
                {!user ? t('packages_page.login_to_support') : t('packages_page.donate')}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('packages_page.no_packages')}</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
