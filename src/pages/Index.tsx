import Nav from "@/components/portfolio/Nav";
import Hero from "@/components/portfolio/Hero";
import About from "@/components/portfolio/About";
import Stack from "@/components/portfolio/Stack";
import Projects from "@/components/portfolio/Projects";
import Playground from "@/components/portfolio/Playground";
import Experience from "@/components/portfolio/Experience";
import Contact from "@/components/portfolio/Contact";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <About />
      <Stack />
      <Projects />
      <Playground />
      <Experience />
      <Contact />
    </main>
  );
};

export default Index;
