import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminUserApprover = () => {
  useEffect(() => {
    const approve = async () => {
      try {
        const email = "gucci@123.com";
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("email", email)
          .maybeSingle();

        if (userProfile) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              role: "vet",
              is_admin_approved: true,
              is_onboarding_complete: true
            })
            .eq("id", userProfile.id);

          if (!updateError) {
            const { data: vetProfile } = await supabase
              .from("vet_profiles")
              .select("id")
              .eq("user_id", userProfile.id)
              .maybeSingle();

            if (vetProfile) {
               await supabase.from("vet_profiles")
                 .update({ verification_status: "verified", is_active: true })
                 .eq("user_id", userProfile.id);
            } else {
               await supabase.from("vet_profiles").insert({
                 user_id: userProfile.id,
                 consultation_type: "online",
                 online_fee: 500,
                 offline_fee: 500,
                 qualification: "DVM",
                 years_of_experience: 5,
                 specializations: ["General"],
                 available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                 verification_status: "verified",
                 is_active: true
               });
            }
            toast.success("User gucci@123.com has been approved as a Vet Dashboard user.");
          }
        }
      } catch (err) {
        // Silent fail
      }
    };
    approve();
  }, []);

  return null;
};
