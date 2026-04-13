import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ProblemSection from '@/components/ProblemSection'
import FeaturesSection from '@/components/FeaturesSection'
import ComparisonTable from '@/components/ComparisonTable'
import PricingSection from '@/components/PricingSection'
import WaitlistSection from '@/components/WaitlistSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <ComparisonTable />
        <PricingSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  )
}
