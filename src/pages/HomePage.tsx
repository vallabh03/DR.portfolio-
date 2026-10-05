import Hero from '../sections/Hero'
import About from '../sections/About'
import Expertise from '../sections/Expertise'
import Approach from '../sections/Approach'
import Experience from '../sections/Experience'
import Credentials from '../sections/Credentials'
import Research from '../sections/Research'
import Testimonials from '../sections/Testimonials'
import Contact from '../sections/Contact'
import { showTestimonials } from '../data/navigation'

/** The single scrolling home page. Section order matches data/navigation.ts. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Expertise />
      <Approach />
      <Experience />
      <Credentials />
      <Research />
      {showTestimonials && <Testimonials />}
      <Contact />
    </>
  )
}
