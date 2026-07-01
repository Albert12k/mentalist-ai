import { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
} from "react-native";

// 🎨 TIPOS
import { Subject } from "../types/Subject";

// 🎨 CORES
import { colorPalette } from "../data/colors";

// 🧠 CONTEXT GLOBAL
import { useSubjects } from "../contexts/SubjectsContext";

export default function SubjectsScreen() {
  // =========================
  // 📦 CONTEXT
  // =========================
  const { subjects, addSubject, updateSubjects } = useSubjects();

  // =========================
  // 🧠 STATES DO MODAL
  // =========================
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#7C4DFF");

  // =========================
  // ➕ CRIAR MATÉRIA
  // =========================
  function handleCreateSubject() {
    if (!name.trim()) return;

    const newSubject: Subject = {
      id: String(Date.now()),
      name: name.trim(),
      color: selectedColor,
      retention: 0,
    };

    addSubject(newSubject);

    // reset
    setName("");
    setSelectedColor("#7C4DFF");
    setModalVisible(false);
  }

  // =========================
  // 🧠 ESTUDAR (RETENÇÃO)
  // =========================
  function handleStudy(id: string) {
    const updated = subjects.map((sub) => {
      if (sub.id === id) {
        return {
          ...sub,
          retention: Math.min(sub.retention + 5, 100),
        };
      }
      return sub;
    });

    updateSubjects(updated);
  }

  // =========================
  // 🎨 RENDER ITEM
  // =========================
  const renderSubject = (item: Subject) => (
    <View
      key={item.id}
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#161625",
        marginBottom: 10,
        borderLeftWidth: 6,
        borderLeftColor: item.color,
      }}
    >
      {/* 📘 NOME */}
      <Text style={{ color: "white", fontSize: 16 }}>
        {item.name}
      </Text>

      {/* 📊 RETENÇÃO */}
      <Text style={{ color: "#888", marginTop: 4 }}>
        Retenção: {item.retention.toFixed(1)}%
      </Text>

      {/* ⚡ BOTÃO ESTUDAR */}
      <Pressable
        onPress={() => handleStudy(item.id)}
        style={{
          marginTop: 10,
          backgroundColor: "#7C4DFF",
          padding: 8,
          borderRadius: 8,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
          Estudar +XP
        </Text>
      </Pressable>
    </View>
  );

  // =========================
  // 🧠 MODAL DE CRIAÇÃO
  // =========================
  const CreationModal = () => (
    <Modal visible={modalVisible} animationType="slide">
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#080810",
          padding: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 20 }}>
          Criar Matéria
        </Text>

        {/* INPUT */}
        <TextInput
          placeholder="Nome da matéria"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          style={{
            backgroundColor: "#161625",
            color: "white",
            padding: 12,
            borderRadius: 10,
            marginTop: 20,
          }}
        />

        {/* CORES */}
        <Text style={{ color: "#888", marginTop: 20 }}>
          Escolha uma cor
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 10,
            gap: 10,
          }}
        >
          {colorPalette.map((color) => (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                backgroundColor: color,
                borderWidth: selectedColor === color ? 3 : 1,
                borderColor:
                  selectedColor === color ? "white" : "transparent",
              }}
            />
          ))}
        </View>

        {/* CRIAR */}
        <Pressable
          onPress={handleCreateSubject}
          style={{
            marginTop: 30,
            backgroundColor: "#00E676",
            padding: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "700" }}>
            Criar
          </Text>
        </Pressable>

        {/* CANCELAR */}
        <Pressable
          onPress={() => setModalVisible(false)}
          style={{ marginTop: 10, padding: 14 }}
        >
          <Text style={{ color: "#888", textAlign: "center" }}>
            Cancelar
          </Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );

  // =========================
  // 🧠 UI PRINCIPAL
  // =========================
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#080810",
        padding: 20,
      }}
    >
      {/* HEADER */}
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "700",
        }}
      >
        📚 Matérias
      </Text>

      {/* LISTA */}
      <View style={{ marginTop: 20 }}>
        {subjects.length === 0 ? (
          <Text style={{ color: "#888" }}>
            Nenhuma matéria criada ainda
          </Text>
        ) : (
          subjects.map(renderSubject)
        )}
      </View>

      {/* BOTÃO CRIAR */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          marginTop: 20,
          backgroundColor: "#7C4DFF",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          + Nova Matéria
        </Text>
      </Pressable>

      {/* MODAL */}
      <CreationModal />
    </SafeAreaView>
  );
}