import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";
  
export default function HelpPage() {
    const faqs = [
        {
            question: "What is the eligibility criteria for donating blood?",
            answer: "To donate blood, you must be in good health, weigh at least 50 kg, and be between 18 and 65 years old. Other medical conditions may apply, and it's best to consult with the blood bank staff."
        },
        {
            question: "How often can I donate blood?",
            answer: "A healthy individual can donate whole blood every 3 months (90 days). For other types of donations, like platelets, the frequency may differ."
        },
        {
            question: "How do I find a nearby blood bank or a donation camp?",
            answer: "You can use the main dashboard to search for nearby blood banks by name or blood type. The interactive map provides a visual overview of their locations and current stock levels."
        },
        {
            question: "Is the blood donation process safe?",
            answer: "Absolutely. All blood collection is done under the supervision of trained medical staff using sterile, single-use equipment. Your safety is the top priority."
        },
        {
            question: "What should I do before and after donating blood?",
            answer: "Before donating, have a healthy meal and drink plenty of fluids. After donating, rest for a short period, have the provided refreshments, and avoid strenuous activity for the rest of the day."
        }
    ];

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Help & Support
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions and get in touch with us.
          </p>
        </div>
  
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Frequently Asked Questions</CardTitle>
                    <CardDescription>Browse through common questions about blood donation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                             <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent>
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Contact Us</CardTitle>
                    <CardDescription>Reach out to our support team directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">National Helpline</h3>
                            <p className="text-muted-foreground text-sm">For urgent blood requirements or queries.</p>
                            <a href="tel:104" className="text-primary font-medium mt-1 inline-block">104 (Health Helpline)</a>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Email Support</h3>
                            <p className="text-muted-foreground text-sm">Send us an email for non-urgent inquiries.</p>
                            <a href="mailto:support@bloodaid.io" className="text-primary font-medium mt-1 inline-block">support@bloodaid.io</a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    );
}
