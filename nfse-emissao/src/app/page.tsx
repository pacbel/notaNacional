import { redirect } from "next/navigation";

export default function Home() {
  redirect('/dashboard');
  
  // Esta parte nunca será executada devido ao redirecionamento acima
  return null;
}
